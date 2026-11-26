/**
 * Vercel Serverless Function: GET /api/booking
 *
 * Returns booking status. If booking is still PENDING and has a stripe session,
 * it will check Stripe directly to see if payment was actually completed.
 */
const { handleCors } = require('./_cors');
const bookingService = require('../back-end/services/booking.service');

module.exports = async function handleGetBooking(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, session_id } = req.query || {};

    if (!id && !session_id) {
      return res.status(400).json({ error: 'Please specify booking id or session_id' });
    }

    let booking = null;
    if (id) {
      booking = await bookingService.getBookingById(id);
    } else if (session_id) {
      booking = await bookingService.getBookingBySessionId(session_id);
    }

    // If booking is still PENDING but has a stripe session, check Stripe directly
    if (booking && booking.status === 'PENDING' && booking.stripe_checkout_session_id) {
      try {
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);

        console.log(`[Booking API] Stripe session status: ${session.payment_status} for booking ${booking.id}`);

        if (session.payment_status === 'paid') {
          // Stripe says PAID but webhook didn't fire — manually confirm
          console.log(`[Booking API] Webhook missed! Manually confirming booking ${booking.id}`);
          await bookingService.confirmPayment({
            bookingId: booking.id,
            paymentIntentId: session.payment_intent,
            eventId: `manual_confirm_${Date.now()}`,
            amount: session.amount_total ? session.amount_total / 100 : booking.total_amount,
            currency: session.currency ? session.currency.toUpperCase() : 'CAD',
          });

          // Re-fetch to get updated data
          if (id) {
            booking = await bookingService.getBookingById(id);
          } else {
            booking = await bookingService.getBookingBySessionId(session_id);
          }
        }
      } catch (stripeErr) {
        console.error('[Booking API] Stripe check failed:', stripeErr.message);
      }
    }

    if (!booking) {
      return res.status(200).json({
        success: true,
        booking: {
          status: 'PENDING',
          message: 'Booking record is being processed...',
        },
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get Booking API error:', error);
    return res.status(200).json({
      success: true,
      booking: {
        status: 'PENDING',
        message: 'Verifying payment...',
      },
    });
  }
};
