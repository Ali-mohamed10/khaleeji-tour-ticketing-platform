/**
 * POST /api/checkout
 *
 * Handler for creating a seat reservation & Stripe Checkout Session.
 * Serverless function compatible & Express middleware friendly.
 */
const stripeService = require('../services/stripe.service');
const bookingService = require('../services/booking.service');

module.exports = async function handleCheckout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      eventId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      tableSelections,
      originUrl,
      couponCode,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. You must be logged in to book tickets.' });
    }

    if (!eventId || !customerName || !customerEmail || !tableSelections || !tableSelections.length) {
      return res.status(400).json({ error: 'Missing required booking parameters' });
    }

    // Step 1 & 2 & 3: Reserve tables atomically using Postgres row locks
    const reservationResult = await bookingService.createReservation({
      eventId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      tableSelections,
      reservationMinutes: 15,
    });

    const bookingId = reservationResult.booking_id;
    let totalAmount = reservationResult.total_amount;
    const currency = reservationResult.currency || 'CAD';

    // Server-side coupon verification and genuine discount application
    if (couponCode) {
      const validCoupon = await bookingService.validateCouponServer({
        code: couponCode,
        eventId,
      });

      if (validCoupon) {
        const originalAmount = Number(reservationResult.total_amount);
        const ticketTotal = originalAmount / 1.13;
        const discountRate = Number(validCoupon.discount_percent);
        const discountAmount = Number(((ticketTotal * discountRate) / 100).toFixed(2));
        const netTicketTotal = Math.max(0, ticketTotal - discountAmount);
        const serviceFee = Number((netTicketTotal * 0.13).toFixed(2));
        const grandTotal = Number((netTicketTotal + serviceFee).toFixed(2));

        await bookingService.applyCouponToBooking({
          bookingId,
          couponId: validCoupon.id,
          discountAmount,
          originalAmount,
          newTotal: grandTotal,
        });

        totalAmount = grandTotal;
      }
    }

    const baseUrl = originUrl || process.env.VITE_APP_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/booking/cancel?booking_id=${bookingId}`;

    // Step 4: Create Stripe Checkout Session
    const checkoutSession = await stripeService.createCheckoutSession({
      bookingId,
      amount: totalAmount,
      currency,
      customerEmail,
      successUrl,
      cancelUrl,
      itemsDescription: `Khaleeji Tour - Event Reservation (Booking ID: ${bookingId.slice(0, 8)})`
    });

    // Save checkout_session_id to booking record
    await bookingService.updateStripeSessionId(bookingId, checkoutSession.id);

    return res.status(200).json({
      success: true,
      bookingId,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Checkout API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during checkout'
    });
  }
};
