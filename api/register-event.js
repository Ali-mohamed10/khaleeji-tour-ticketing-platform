/**
 * Vercel Serverless Function: POST /api/register-event
 *
 * Public endpoint to submit event registration.
 * Saves registration record to Supabase and triggers Resend confirmation email.
 */
const { handleCors } = require('./_cors');
const registrationService = require('../back-end/services/registration.service');

module.exports = async function handleRegisterEvent(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { fullName, email, phoneNumber, category } = body;

    // Basic server validation
    if (!fullName || !email || !phoneNumber || !category) {
      return res.status(400).json({
        error: 'Missing required fields: fullName, email, phoneNumber, and category are required',
      });
    }

    const result = await registrationService.createRegistration(body);

    return res.status(201).json(result);
  } catch (err) {
    console.error('[API /register-event] Error:', err.message);
    return res.status(500).json({
      error: err.message || 'An error occurred while processing registration',
    });
  }
};
