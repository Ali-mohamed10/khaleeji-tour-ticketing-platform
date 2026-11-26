/**
 * Vercel Serverless Function: POST /api/cleanup-expired
 *
 * Purpose: Lightweight endpoint called by the frontend when loading
 *          the Event Details page so that expired PENDING bookings
 *          are cleaned up and table booked_seats / status are
 *          recalculated before the visitor sees the seat map.
 *
 * Input: none (body is ignored)
 * Output: { success, expiredCount }
 * Dependencies: booking.service.js → expire_stale_reservations RPC
 */
const { handleCors } = require('./_cors');
const bookingService = require('../back-end/services/booking.service');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const expiredCount = await bookingService.expireStaleReservations();
    return res.status(200).json({
      success: true,
      expiredCount: expiredCount || 0,
    });
  } catch (error) {
    console.error('cleanup-expired error:', error);
    return res.status(500).json({ error: error.message });
  }
};
