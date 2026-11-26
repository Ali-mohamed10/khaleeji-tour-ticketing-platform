/**
 * seatMapConstants.js
 *
 * Purpose: Define table category colors and booking status labels.
 *          Category colors are PERMANENT and represent table type.
 *          Status is COMPUTED from bookedSeats vs capacity.
 * Dependencies: none
 */

// Table categories — permanent colors representing table TYPE
export const TABLE_CATEGORIES = {
  vip_room: { label: 'seatMap.vipRoom', colorVar: '--seat-vip-room', color: '#EF4444', defaultPrice: 125 },
  vip_premium: { label: 'seatMap.vipPremium', colorVar: '--seat-vip-premium', color: '#F59E0B', defaultPrice: 75 },
  vip_standard: { label: 'seatMap.vipStandard', colorVar: '--seat-vip-standard', color: '#22C55E', defaultPrice: 65 },
  general: { label: 'seatMap.general', colorVar: '--seat-general', color: '#94A3B8', defaultPrice: 55 },
  // Backward compatibility aliases
  vip: { label: 'seatMap.vipStandard', colorVar: '--seat-vip-standard', color: '#22C55E', defaultPrice: 65 },
  gold: { label: 'seatMap.vipPremium', colorVar: '--seat-vip-premium', color: '#F59E0B', defaultPrice: 75 },
  silver: { label: 'seatMap.general', colorVar: '--seat-general', color: '#94A3B8', defaultPrice: 55 },
  standard: { label: 'seatMap.general', colorVar: '--seat-general', color: '#94A3B8', defaultPrice: 55 },
};

// Table statuses — labels only, NO color override (category color is always kept)
export const TABLE_STATUSES = {
  available: { label: 'seatMap.available' },
  reserved: { label: 'seatMap.reserved' },
  sold: { label: 'seatMap.sold' },
};

/**
 * Compute booking status from bookedSeats and capacity.
 *
 * @param {number} bookedSeats - Number of seats already booked
 * @param {number} capacity - Total seat capacity of the table
 * @returns {'available' | 'reserved' | 'sold'}
 */
export const computeStatus = (bookedSeats, capacity) => {
  if (bookedSeats <= 0) return 'available';
  if (bookedSeats >= capacity) return 'sold';
  return 'reserved';
};

// Non-interactive SVG element IDs to skip during parsing
export const NON_TABLE_IDS = [
  'stage',
  'dance_floor',
  'track_frame',
  'host_area',
  'entrance',
  'waiting_area',
  'top_tables',
  'left_tables',
  'right_tables',
  'bottom_tables',
];
