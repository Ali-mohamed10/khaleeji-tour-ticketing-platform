/**
 * Authentication & Role-Based Access Control (RBAC) Middleware
 *
 * Purpose: Verify Supabase JWT access tokens and enforce role permissions
 *          for protected Vercel Serverless Functions and Express routes.
 * Input: HTTP Request with `Authorization: Bearer <jwt>` header
 * Output: Authenticated `{ user, role }` or HTTP 401/403 JSON response
 * Dependencies: ../services/supabaseAdmin
 */

/**
 * Extract Bearer token from Authorization header
 * @param {import('http').IncomingMessage} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Authenticate a Supabase user from the request Bearer token and fetch their role
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<{ user: object, role: string }|null>}
 */
async function authenticateRequest(req) {
  const token = extractBearerToken(req);
  if (!token) return null;

  const { supabaseAdmin } = require('../services/supabaseAdmin');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    user: data.user,
    role: profile?.role || 'customer',
  };
}

/**
 * Require an authenticated user with one of the allowed roles.
 * Sends 401/403 response and returns null when unauthorized.
 *
 * @param {object} req
 * @param {object} res
 * @param {string[]} allowedRoles
 * @returns {Promise<{ user: object, role: string }|null>}
 */
async function requireRoles(req, res, allowedRoles = ['admin']) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(auth.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have permission to perform this action.',
      });
      return null;
    }

    return auth;
  } catch (err) {
    console.error('[Auth Middleware] Verification error:', err.message);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
    return null;
  }
}

/**
 * Verify CRON_SECRET Bearer token for scheduled cron endpoints when configured.
 *
 * @param {object} req
 * @param {object} res
 * @returns {boolean} true if authorized, false if 401 was sent
 */
function verifyCronSecret(req, res) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return true;
  }

  const token = extractBearerToken(req);
  if (!token || token !== expectedSecret) {
    res.status(401).json({ error: 'Unauthorized cron invocation' });
    return false;
  }

  return true;
}

module.exports = {
  extractBearerToken,
  authenticateRequest,
  requireRoles,
  verifyCronSecret,
};
