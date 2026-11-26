/**
 * CORS Helper for Vercel Serverless Functions
 *
 * Handles cross-origin requests from Firebase Hosting (khaleejitour.web.app)
 * to Vercel API (book-ticket-sigma.vercel.app).
 */

const ALLOWED_ORIGINS = [
  'https://www.khaleejitour.com',
  'https://khaleejitour.com',
  'https://khaleejitour.web.app',
  'https://khaleejitour.firebaseapp.com',
  'https://book-ticket-sigma.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

/**
 * Set CORS headers on the response
 * @param {Object} req
 * @param {Object} res
 * @returns {boolean} true if this was a preflight OPTIONS request (already handled)
 */
function handleCors(req, res) {
  const origin = req.headers.origin || '';

  // Allow listed origins or any localhost for dev
  if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = { handleCors };
