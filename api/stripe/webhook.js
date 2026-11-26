/**
 * Vercel Serverless Function: POST /api/stripe/webhook
 *
 * ONLY source of truth for confirming payments and generating tickets.
 */
const stripeService = require('../../back-end/services/stripe.service');
const bookingService = require('../../back-end/services/booking.service');

// Disable Vercel body parser to get raw stream buffer for Stripe signature check
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripeService.constructWebhookEvent(rawBody, sig);
    console.log(`[Webhook Received] Event type: ${event.type}, ID: ${event.id}`);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id || session.client_reference_id;
        const paymentIntentId = session.payment_intent;
        const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
        const currency = session.currency ? session.currency.toUpperCase() : 'CAD';

        console.log(`[Webhook] checkout.session.completed: BookingID=${bookingId}, PaymentIntent=${paymentIntentId}`);

        if (bookingId) {
          const result = await bookingService.confirmPayment({
            bookingId,
            paymentIntentId,
            eventId: event.id,
            amount: amountTotal,
            currency,
          });
          console.log(`[Webhook] Payment confirmed successfully for booking ${bookingId}`, result);
        } else {
          console.warn('[Webhook] No booking_id found in checkout session metadata');
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;
        const amount = paymentIntent.amount_received ? paymentIntent.amount_received / 100 : 0;
        const currency = paymentIntent.currency ? paymentIntent.currency.toUpperCase() : 'CAD';

        if (bookingId) {
          console.log(`[Webhook] payment_intent.succeeded for booking ${bookingId}`);
          await bookingService.confirmPayment({
            bookingId,
            paymentIntentId: paymentIntent.id,
            eventId: event.id,
            amount,
            currency,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.booking_id;
        if (bookingId) {
          console.log(`[Webhook] payment_intent.payment_failed for booking ${bookingId}`);
          await bookingService.failPayment(bookingId);
        }
        break;
      }

      default:
        console.log(`[Webhook] Ignored event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Processing error: ${err.message}`, err);
    return res.status(500).json({ error: `Webhook processing failed: ${err.message}` });
  }
};
