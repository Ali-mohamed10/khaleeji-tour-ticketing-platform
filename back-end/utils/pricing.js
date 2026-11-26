/**
 * Pricing & Discount Calculation Utilities
 *
 * Purpose: Centralize HST tax extraction, coupon percentage discount math,
 *          and final checkout total calculation so checkout handlers and
 *          unit tests share a single source of truth.
 */

const HST_RATE = 0.13;

/**
 * Calculate discounted booking totals given an HST-inclusive original amount
 * and a coupon discount percentage.
 *
 * @param {number} originalTotal - Original total including 13% HST
 * @param {number} discountPercent - Coupon discount percentage (0-100)
 * @returns {{ originalAmount: number, ticketTotal: number, discountAmount: number, netTicketTotal: number, serviceFee: number, grandTotal: number }}
 */
function calculateDiscountedTotal(originalTotal, discountPercent) {
  const originalAmount = Number(originalTotal);
  const clampedPercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));

  const ticketTotal = originalAmount / (1 + HST_RATE);
  const discountAmount = Number(((ticketTotal * clampedPercent) / 100).toFixed(2));
  const netTicketTotal = Math.max(0, ticketTotal - discountAmount);
  const serviceFee = Number((netTicketTotal * HST_RATE).toFixed(2));
  const grandTotal = Number((netTicketTotal + serviceFee).toFixed(2));

  return {
    originalAmount,
    ticketTotal: Number(ticketTotal.toFixed(2)),
    discountAmount,
    netTicketTotal: Number(netTicketTotal.toFixed(2)),
    serviceFee,
    grandTotal,
  };
}

/**
 * Extract a ticket or registration code from a raw QR payload string.
 * Supports plain codes (e.g. "KT-1234", "PC4-2026-0001") and JSON QR payloads.
 *
 * @param {string} rawCode
 * @returns {string}
 */
function extractTicketCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';
  const trimmed = rawCode.trim();
  if (!trimmed.startsWith('{')) return trimmed;

  try {
    const parsed = JSON.parse(trimmed);
    const extracted =
      parsed.regNum ||
      parsed.registration_number ||
      parsed.ticketCode ||
      parsed.ticket_code ||
      parsed.id;
    return extracted ? String(extracted).trim() : trimmed;
  } catch {
    return trimmed;
  }
}

module.exports = {
  HST_RATE,
  calculateDiscountedTotal,
  extractTicketCode,
};
