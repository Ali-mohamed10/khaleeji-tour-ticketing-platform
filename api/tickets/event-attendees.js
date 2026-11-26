/**
 * Vercel Serverless Function: GET/POST /api/tickets/event-attendees
 *
 * Endpoint to fetch live event check-in statistics & attendees directory,
 * and toggle manual check-in status.
 */
const { handleCors } = require('../_cors');
const { requireRoles } = require('../../back-end/middleware/auth');
const ticketService = require('../../back-end/services/ticket.service');

module.exports = async function handleEventAttendees(req, res) {
  if (handleCors(req, res)) return;

  try {
    const auth = await requireRoles(req, res, ['admin', 'editor', 'gate_staff']);
    if (!auth) return;

    if (req.method === 'GET') {
      const { event_id, source } = req.query || {};
      const data = await ticketService.getEventAttendeesAndStats(event_id || null, source || 'all');
      return res.status(200).json({
        success: true,
        ...data,
      });
    }

    if (req.method === 'POST') {
      const { ticketId, isUsed, isRegistration, adminId } = req.body || {};
      if (!ticketId) {
        return res.status(400).json({ error: 'ticketId is required' });
      }

      const updatedTicket = await ticketService.toggleTicketCheckIn({
        ticketId,
        isUsed: !!isUsed,
        isRegistration: !!isRegistration,
        adminId: adminId || null,
      });

      return res.status(200).json({
        success: true,
        ticket: updatedTicket,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Event attendees API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};
