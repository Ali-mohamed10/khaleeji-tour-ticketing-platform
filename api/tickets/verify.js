/**
 * Vercel Serverless Function: POST/GET /api/tickets/verify
 *
 * Gate Check-in endpoint to verify and mark tickets as used.
 */
const { handleCors } = require('../_cors');
const { requireRoles } = require('../../back-end/middleware/auth');
const { extractTicketCode } = require('../../back-end/utils/pricing');
const ticketService = require('../../back-end/services/ticket.service');

module.exports = async function handleVerifyTicket(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireRoles(req, res, ['admin', 'editor', 'gate_staff']);
    if (!auth) return;

    const body = req.method === 'POST' ? req.body || {} : req.query || {};
    const rawCode = body.code || body.ticketCode || body.ticket_code;
    const checkIn = body.checkIn !== false && body.checkIn !== 'false';

    if (!rawCode) {
      return res.status(400).json({
        status: 'INVALID',
        error: 'Ticket code is required',
      });
    }

    const parsedCode = extractTicketCode(String(rawCode));

    const result = await ticketService.verifyAndCheckIn({
      ticketCode: parsedCode,
      checkIn,
      adminId: body.adminId || auth.user.id,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Ticket verification API error:', error);
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      error: error.message || 'Internal server error during verification',
    });
  }
};
