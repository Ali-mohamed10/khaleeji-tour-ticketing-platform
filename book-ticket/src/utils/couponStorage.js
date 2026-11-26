/**
 * Coupon Storage Utility
 *
 * Purpose: Persist applied discount coupons in localStorage across page refreshes,
 *          user auth changes, and Stripe checkout redirects, then clear upon successful payment.
 * Inputs: eventId (string), couponData (object)
 * Output: Stored / retrieved coupon data or void
 * Dependencies: none (pure localStorage wrapper)
 */

const STORAGE_KEY = 'khaleeji_tour_applied_coupon';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max retention

/**
 * Save applied coupon for a given event to localStorage.
 * @param {string} eventId
 * @param {object|null} couponData
 */
export const saveStoredCoupon = (eventId, couponData) => {
  if (typeof window === 'undefined') return;
  try {
    if (!couponData || !couponData.code) {
      clearStoredCoupon(eventId);
      return;
    }

    const payload = {
      eventId: eventId || null,
      coupon: couponData,
      savedAt: Date.now(),
    };

    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (eventId) {
      localStorage.setItem(`${STORAGE_KEY}_${eventId}`, serialized);
    }
  } catch (err) {
    console.warn('Failed to save coupon to localStorage:', err);
  }
};

/**
 * Get stored applied coupon for an event.
 * @param {string} [eventId]
 * @returns {object|null}
 */
export const getStoredCoupon = (eventId) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      (eventId ? localStorage.getItem(`${STORAGE_KEY}_${eventId}`) : null) ||
      localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.coupon) return null;

    // Check expiration (24h retention limit)
    if (data.savedAt && Date.now() - data.savedAt > MAX_AGE_MS) {
      clearStoredCoupon(eventId);
      return null;
    }

    // Verify event applicability if eventId is specified
    if (eventId && data.eventId && data.eventId !== eventId) {
      return null;
    }

    // Check if the underlying coupon object has an explicit expiry date that passed
    if (data.coupon?.coupon?.expires_at) {
      const expiry = new Date(data.coupon.coupon.expires_at);
      if (expiry <= new Date()) {
        clearStoredCoupon(eventId);
        return null;
      }
    }

    return data.coupon;
  } catch (err) {
    console.warn('Failed to load coupon from localStorage:', err);
    return null;
  }
};

/**
 * Clear stored applied coupon (e.g. upon successful booking & payment or manual removal).
 * @param {string} [eventId]
 */
export const clearStoredCoupon = (eventId) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (eventId) {
      localStorage.removeItem(`${STORAGE_KEY}_${eventId}`);
    }
    // Sweep any event-specific coupon keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Failed to clear coupon from localStorage:', err);
  }
};

export default {
  saveStoredCoupon,
  getStoredCoupon,
  clearStoredCoupon,
};
