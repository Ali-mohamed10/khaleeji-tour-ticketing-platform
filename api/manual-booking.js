/**
 * Vercel Serverless Function: POST /api/manual-booking
 *
 * Handles admin manual/offline reservations (Cash & WhatsApp).
 * Atomically locks table seats, creates a PAID booking record,
 * issues the official KT ticket with QR code, and triggers
 * the Resend confirmation email via bookingConfirmation.js template.
 */
const { handleCors } = require('./_cors');
const { requireRoles } = require('../back-end/middleware/auth');
const bookingService = require('../back-end/services/booking.service');

module.exports = async function handleManualBooking(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. Enforce Admin RBAC authentication
    const auth = await requireRoles(req, res, ['admin']);
    if (!auth) return;
    const adminUserId = auth.user.id;

    const body = req.body || {};
    const {
      eventId,
      tableId,
      tableCode,
      seatsCount,
      customerEmail,
      customerName,
      customerPhone,
      paymentMethod = 'Cash / WhatsApp',
      customAmount = null,
    } = body;

    // 2. Basic Server-side Validation
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    if (!customerEmail || !/^\S+@\S+\.\S+$/.test(String(customerEmail).trim())) {
      return res.status(400).json({ success: false, error: 'A valid customer email address is required' });
    }

    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    if (!customerPhone || !String(customerPhone).trim()) {
      return res.status(400).json({ success: false, error: 'Customer phone number is required' });
    }

    if (!tableId && !tableCode) {
      return res.status(400).json({ success: false, error: 'Table selection or table number is required' });
    }

    const parsedSeats = parseInt(seatsCount, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) {
      return res.status(400).json({ success: false, error: 'Seats count must be at least 1' });
    }

    // 3. Execute business logic through Booking Service
    const result = await bookingService.createManualOfflineBooking({
      eventId,
      tableId: tableId || null,
      tableCode: tableCode || null,
      seatsCount: parsedSeats,
      customerName: customerName ? String(customerName).trim() : null,
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: customerPhone ? String(customerPhone).trim() : null,
      paymentMethod: String(paymentMethod).trim(),
      customAmount: customAmount !== null && customAmount !== undefined && !isNaN(Number(customAmount)) ? Number(customAmount) : null,
      adminUserId,
    });

    return res.status(200).json({
      success: true,
      bookingId: result.bookingId,
      ticketCode: result.ticketCode,
      ticket: result.ticket,
      bookingResult: result.bookingResult,
      emailDelivered: result.emailDelivered,
      adminEmailDelivered: result.adminEmailDelivered,
      message: 'Manual booking created successfully and confirmation emails dispatched.',
    });
  } catch (err) {
    console.error('[API /api/manual-booking] Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred while creating manual booking',
    });
  }
};
