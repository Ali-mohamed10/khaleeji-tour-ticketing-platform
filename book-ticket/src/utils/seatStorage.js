/**
 * Seat Selection Storage Utility
 *
 * Purpose: Persist seat & table selections in localStorage across page refreshes,
 *          logins/logouts, and Stripe redirects, then clear upon successful payment.
 */

const STORAGE_KEY = 'khaleeji_tour_selected_seats';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max retention

/**
 * Save selected tables for a given event to localStorage.
 * @param {string} eventId
 * @param {string} slug
 * @param {Array} selectedTables
 */
export const saveStoredSeats = (eventId, slug, selectedTables) => {
  if (typeof window === 'undefined') return;
  try {
    if (!selectedTables || selectedTables.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      if (eventId) localStorage.removeItem(`${STORAGE_KEY}_${eventId}`);
      return;
    }

    const payload = {
      eventId,
      slug,
      selectedTables,
      savedAt: Date.now(),
    };

    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (eventId) {
      localStorage.setItem(`${STORAGE_KEY}_${eventId}`, serialized);
    }
  } catch (err) {
    console.warn('Failed to save selected seats to localStorage:', err);
  }
};

/**
 * Get stored selected tables for an event.
 * @param {string} eventId
 * @param {string} [slug]
 * @returns {Array|null}
 */
export const getStoredSeats = (eventId, slug) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      (eventId ? localStorage.getItem(`${STORAGE_KEY}_${eventId}`) : null) ||
      localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.selectedTables) return null;

    // Check expiration (24h)
    if (data.savedAt && Date.now() - data.savedAt > MAX_AGE_MS) {
      clearStoredSeats(eventId);
      return null;
    }

    // Verify it matches current event if provided
    if (eventId && data.eventId && data.eventId !== eventId) {
      return null;
    }
    if (slug && data.slug && data.slug !== slug) {
      return null;
    }

    return Array.isArray(data.selectedTables) ? data.selectedTables : null;
  } catch (err) {
    console.warn('Failed to load selected seats from localStorage:', err);
    return null;
  }
};

/**
 * Clear stored seat selections (e.g. upon successful booking & payment).
 * @param {string} [eventId]
 */
export const clearStoredSeats = (eventId) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (eventId) {
      localStorage.removeItem(`${STORAGE_KEY}_${eventId}`);
    }
    // Also sweep any stale event-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Failed to clear selected seats from localStorage:', err);
  }
};
