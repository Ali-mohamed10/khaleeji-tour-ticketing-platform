/**
 * Auth Redirect Utilities
 *
 * Resolves and sanitizes destination URLs after authentication (login, registration).
 * Protects against open redirect vulnerabilities and circular loops while supporting
 * React Router location objects, query parameters, and custom state.
 */

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/email-confirmed',
];

/**
 * Sanitizes a redirect path to ensure it is internal and not an auth page.
 * @param {string|object} target
 * @param {string} [fallback='/']
 * @returns {string}
 */
export const sanitizeRedirectUrl = (target, fallback = '/') => {
  if (!target) return fallback;

  // If React Router location object
  if (typeof target === 'object' && target !== null) {
    const pathname = target.pathname || '';
    if (!pathname || AUTH_PATHS.some((p) => pathname.startsWith(p))) {
      return fallback;
    }
    const search = target.search || '';
    const hash = target.hash || '';
    return `${pathname}${search}${hash}` || fallback;
  }

  // If string
  if (typeof target === 'string') {
    const trimmed = target.trim();
    // Only allow internal relative paths (must start with '/' and not '//')
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
      return fallback;
    }
    const cleanPath = trimmed.split('?')[0].split('#')[0];
    if (AUTH_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(`${p}/`))) {
      return fallback;
    }
    return trimmed;
  }

  return fallback;
};

/**
 * Extracts a safe redirect URL from React Router location state or search params.
 * @param {object} [location] - React Router location object
 * @param {URLSearchParams} [searchParams] - React Router search params
 * @param {string} [fallback='/']
 * @returns {string}
 */
export const getRedirectTarget = (location, searchParams, fallback = '/') => {
  const stateFrom = location?.state?.from;
  const queryFrom = searchParams?.get('from') || searchParams?.get('redirect');

  if (stateFrom) {
    const sanitized = sanitizeRedirectUrl(stateFrom, '');
    if (sanitized) return sanitized;
  }

  if (queryFrom) {
    const sanitized = sanitizeRedirectUrl(queryFrom, '');
    if (sanitized) return sanitized;
  }

  return fallback;
};
