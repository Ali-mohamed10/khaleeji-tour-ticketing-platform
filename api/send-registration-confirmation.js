/**
 * Vercel Serverless Function: POST /api/send-registration-confirmation
 *
 * Endpoint to send or manually resend registration confirmation email.
 * Dispatches transactional email via Resend and updates registration status in Supabase.
 */
const { handleCors } = require('./_cors');
const registrationService = require('../back-end/services/registration.service');

module.exports = async function handleSendRegistrationConfirmation(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { registrationId } = req.body || {};

    if (!registrationId) {
      return res.status(400).json({ error: 'registrationId is required' });
    }

    const result = await registrationService.sendConfirmationEmail(registrationId);

    if (!result.success) {
      return res.status(500).json({
        error: result.error || 'Failed to send confirmation email',
        details: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent successfully',
      data: result.data,
    });
  } catch (err) {
    console.error('[API /send-registration-confirmation] Error:', err.message);
    return res.status(500).json({
      error: err.message || 'Internal server error while sending confirmation email',
    });
  }
};
