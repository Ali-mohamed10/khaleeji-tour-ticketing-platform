/**
 * Vercel Serverless Function: POST /api/checkout
 */
const { handleCors } = require('./_cors');
const stripeService = require('../back-end/services/stripe.service');
const bookingService = require('../back-end/services/booking.service');
const { calculateDiscountedTotal } = require('../back-end/utils/pricing');

module.exports = async function handleCheckout(req, res) {
  if (handleCors(req, res)) return;

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
    } = req.body || {};

    // Detailed logging for debugging
    console.log('[checkout.js] Received request body:', JSON.stringify({
      eventId,
      userId,
      customerName,
      customerEmail: customerEmail ? `${customerEmail.slice(0, 3)}...` : null,
      tableSelections,
      couponCode,
    }));

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. You must be logged in to book tickets.' });
    }

    if (!eventId || !customerName || !customerEmail || !tableSelections || !tableSelections.length) {
      console.error('[checkout.js] Missing required params:', { eventId: !!eventId, customerName: !!customerName, customerEmail: !!customerEmail, tableSelections: tableSelections?.length });
      return res.status(400).json({ error: 'Missing required booking parameters' });
    }

    // Reserve tables atomically using Postgres row locks
    console.log('[checkout.js] Calling createReservation with tableSelections:', JSON.stringify(tableSelections));
    const reservationResult = await bookingService.createReservation({
      eventId,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      tableSelections,
      reservationMinutes: 15,
    });

    console.log('[checkout.js] Reservation result:', JSON.stringify(reservationResult));

    const bookingId = reservationResult.booking_id;
    let totalAmount = reservationResult.total_amount;
    const currency = reservationResult.currency || 'CAD';

    if (!bookingId) {
      console.error('[checkout.js] No booking_id returned from reservation:', reservationResult);
      return res.status(500).json({ error: 'Reservation created but no booking ID returned.' });
    }

    // Server-side coupon verification and genuine discount application
    if (couponCode) {
      const validCoupon = await bookingService.validateCouponServer({
        code: couponCode,
        eventId,
      });

      if (validCoupon) {
        const {
          originalAmount,
          discountAmount,
          grandTotal,
        } = calculateDiscountedTotal(reservationResult.total_amount, validCoupon.discount_percent);

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

    const baseUrl = originUrl || `https://${req.headers.host}` || 'http://localhost:5173';
    const successUrl = `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/booking/cancel?booking_id=${bookingId}`;

    // Create Stripe Checkout Session
    console.log('[checkout.js] Creating Stripe session for amount:', totalAmount, currency);
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

    console.log('[checkout.js] Success! checkoutUrl:', checkoutSession.url?.slice(0, 60) + '...');
    return res.status(200).json({
      success: true,
      bookingId,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[checkout.js] ERROR:', error.message);
    console.error('[checkout.js] Stack:', error.stack);
    return res.status(500).json({
      error: error.message || 'Internal server error during checkout'
    });
  }
};
