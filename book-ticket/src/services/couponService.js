/**
 * Coupon Service
 *
 * Provides APIs for fetching, creating, validating, toggling, and deleting
 * ticket discount coupons via Supabase.
 */
import { supabase } from '../lib/supabaseClient';

export const couponService = {
  /**
   * Fetch all coupons ordered by creation date descending
   * with joined event information.
   */
  async getCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        events (
          id,
          title_en,
          title_ar,
          slug,
          cover_image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Create a new discount coupon
   */
  async createCoupon({
    code,
    discount_percent,
    event_id = null,
    event_ids = null,
    is_active = true,
    max_uses = null,
    expires_at = null,
    notes = null,
  }) {
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 2) {
      throw new Error('Coupon code must be at least 2 characters long');
    }

    const discountNum = parseFloat(discount_percent);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      throw new Error('Discount percentage must be between 1 and 100');
    }

    // Process event IDs array
    const validEventIds = Array.isArray(event_ids) && event_ids.length > 0
      ? event_ids.filter((id) => id && id !== 'all')
      : event_id && event_id !== 'all'
      ? [event_id]
      : [];

    const payload = {
      code: cleanCode,
      discount_percent: discountNum,
      event_id: validEventIds.length === 1 ? validEventIds[0] : null,
      event_ids: validEventIds.length > 0 ? validEventIds : null,
      is_active: Boolean(is_active),
      max_uses: max_uses ? parseInt(max_uses, 10) : null,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      notes: notes ? notes.trim() : null,
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert([payload])
      .select(`
        *,
        events (
          id,
          title_en,
          title_ar,
          slug,
          cover_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      if (error.code === '23505') {
        throw new Error('A coupon with this code already exists');
      }
      throw error;
    }

    return data;
  },

  /**
   * Toggle active/inactive status of a coupon
   */
  async toggleCouponStatus(id, isActive) {
    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        events (
          id,
          title_en,
          title_ar,
          slug,
          cover_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error toggling coupon status:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete a coupon permanently
   */
  async deleteCoupon(id) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }

    return true;
  },

  /**
   * Validate a coupon code for a given event ID in real-time
   * Returns validity status, discount percentage, and error details if invalid.
   */
  async validateCoupon(code, eventId) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, messageKey: 'checkout.coupon.emptyCode', message: 'Please enter a coupon code' };
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, messageKey: 'checkout.coupon.validationError', message: 'Failed to validate coupon' };
    }

    if (!data) {
      return { valid: false, messageKey: 'checkout.coupon.notFound', message: 'Invalid coupon code' };
    }

    if (!data.is_active) {
      return { valid: false, messageKey: 'checkout.coupon.inactive', message: 'This coupon is inactive' };
    }

    // Check expiration date
    if (data.expires_at) {
      const expiry = new Date(data.expires_at);
      if (expiry <= new Date()) {
        return { valid: false, messageKey: 'checkout.coupon.expired', message: 'This coupon has expired' };
      }
    }

    // Check maximum usage limit
    if (data.max_uses !== null && data.used_count >= data.max_uses) {
      return { valid: false, messageKey: 'checkout.coupon.maxUsesReached', message: 'This coupon has reached its usage limit' };
    }

    // Check event applicability
    if (eventId) {
      const hasEventIds = Array.isArray(data.event_ids) && data.event_ids.length > 0;
      if (hasEventIds && !data.event_ids.includes(eventId)) {
        return { valid: false, messageKey: 'checkout.coupon.wrongEvent', message: 'This coupon is not valid for this event' };
      }
      if (!hasEventIds && data.event_id && data.event_id !== eventId) {
        return { valid: false, messageKey: 'checkout.coupon.wrongEvent', message: 'This coupon is not valid for this event' };
      }
    }

    return {
      valid: true,
      coupon: data,
      code: data.code,
      discountPercent: Number(data.discount_percent),
    };
  },
};

export default couponService;
