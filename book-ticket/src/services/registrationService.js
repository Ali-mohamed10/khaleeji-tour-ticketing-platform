/**
 * Registration Service (Frontend Client)
 *
 * Provides functions for submitting public event registrations,
 * querying registrations in the admin dashboard, updating attendee status,
 * deleting registrations, and manually re-triggering confirmation emails.
 */
import { supabase } from '../lib/supabaseClient';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  // In dev mode, use relative paths — Vite proxy forwards /api/* to production
  return '';
};

export const registrationService = {
  /**
   * Public: Submit a new event registration via secure serverless API
   *
   * @param {Object} payload
   * @returns {Promise<{success: boolean, registration: Object, emailStatus: string}>}
   */
  async submitRegistration(payload) {
    const apiBase = getApiBaseUrl();
    const endpoint = `${apiBase}/api/register-event`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) return result;
      }
    } catch (apiErr) {
      console.warn('[registrationService] API endpoint unavailable, falling back to Supabase RPC:', apiErr);
    }

    // Direct Supabase RPC Fallback (ensures 100% reliability)
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_event_registration', {
      p_full_name: (payload.fullName || '').trim(),
      p_email: (payload.email || '').trim().toLowerCase(),
      p_phone_number: (payload.phoneNumber || '').trim(),
      p_city: (payload.city || '').trim() || null,
      p_category: (payload.category || '').trim(),
      p_organization_name: (payload.organizationName || '').trim() || null,
      p_job_title: (payload.jobTitle || '').trim() || null,
      p_discovery_source: (payload.discoverySource || '').trim() || null,
      p_preferred_language: payload.preferredLanguage || 'ar',
      p_event_id: payload.eventId || null,
      p_event_title: payload.eventTitle || 'The 4th Press Conference',
      p_notes: payload.notes || null,
      p_question_topic: (payload.questionTopic || '').trim() || null,
      p_question_text: (payload.questionText || '').trim() || null,
    });

    if (rpcError || !rpcData) {
      console.error('[registrationService] Supabase RPC error:', rpcError);
      throw new Error(rpcError?.message || 'Failed to submit registration');
    }

    // Ensure qr_code_url is generated and saved if missing
    if (!rpcData.qr_code_url) {
      const qrPayload = JSON.stringify({
        id: rpcData.id,
        regNum: rpcData.registration_number,
        name: rpcData.full_name,
        email: rpcData.email,
        event: rpcData.event_title || 'The 4th Press Conference',
      });
      const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=360&margin=1&ecLevel=H&format=png`;
      rpcData.qr_code_url = qrCodeUrl;
      try {
        await supabase.rpc('update_registration_qr_code', {
          p_registration_id: rpcData.id,
          p_qr_code_url: qrCodeUrl,
        });
      } catch {
        // Non-blocking
      }
    }

    // Attempt to trigger email in background
    try {
      await fetch(`${apiBase}/api/send-registration-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: rpcData.id }),
      });
    } catch {
      // Non-blocking email attempt
    }

    return {
      success: true,
      registration: rpcData,
      emailStatus: rpcData.confirmation_email_status || 'pending',
    };
  },

  /**
   * Helper to ensure a registration object has a valid QR code URL
   * @param {Object} reg
   * @returns {string}
   */
  getQrCodeUrl(reg) {
    if (reg?.qr_code_url) return reg.qr_code_url;
    if (!reg?.id && !reg?.registration_number) return '';
    const payload = JSON.stringify({
      id: reg.id || '',
      regNum: reg.registration_number || '',
      name: reg.full_name || '',
      email: reg.email || '',
      event: reg.event_title || 'The 4th Press Conference',
    });
    return `https://quickchart.io/qr?text=${encodeURIComponent(payload)}&size=360&margin=1&ecLevel=H&format=png`;
  },

  /**
   * Admin: Query all event registrations with search, filter, and pagination
   */
  async getRegistrations({
    search = '',
    status = 'all',
    emailStatus = 'all',
    category = 'all',
    eventFilter = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 15,
  } = {}) {
    let query = supabase
      .from('event_registrations')
      .select('*', { count: 'exact' });

    // Text Search
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = query.or(
        `full_name.ilike.${term},email.ilike.${term},phone_number.ilike.${term},registration_number.ilike.${term},organization_name.ilike.${term}`
      );
    }

    // Status Filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Email Status Filter
    if (emailStatus && emailStatus !== 'all') {
      query = query.eq('confirmation_email_status', emailStatus);
    }

    // Category Filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Event / Conference Filter
    if (eventFilter && eventFilter !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventFilter);
      if (isUuid) {
        query = query.eq('event_id', eventFilter);
      } else {
        query = query.eq('event_title', eventFilter);
      }
    }

    // Sorting
    query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' });

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[registrationService] getRegistrations error:', error);
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    };
  },

  /**
   * Admin: Get metrics summary
   */
  async getStats(eventFilter = 'all') {
    let query = supabase
      .from('event_registrations')
      .select('id, status, confirmation_email_status, category, event_id, event_title');

    if (eventFilter && eventFilter !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventFilter);
      if (isUuid) {
        query = query.eq('event_id', eventFilter);
      } else {
        query = query.eq('event_title', eventFilter);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[registrationService] getStats error:', error);
      throw error;
    }

    const items = data || [];
    return {
      total: items.length,
      registered: items.filter((i) => i.status === 'registered').length,
      attended: items.filter((i) => i.status === 'attended').length,
      cancelled: items.filter((i) => i.status === 'cancelled').length,
      emailsSent: items.filter((i) => i.confirmation_email_status === 'sent').length,
      emailsFailed: items.filter((i) => i.confirmation_email_status === 'failed').length,
    };
  },

  /**
   * Admin: Get distinct event titles / conferences for filtering
   */
  async getDistinctEvents() {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('event_id, event_title');

    if (error) {
      console.error('[registrationService] getDistinctEvents error:', error);
      return [{ id: 'The 4th Press Conference', title: 'The 4th Press Conference' }];
    }

    const seen = new Set();
    const list = [];
    (data || []).forEach((row) => {
      const title = row.event_title || 'The 4th Press Conference';
      if (!seen.has(title)) {
        seen.add(title);
        list.push({ id: row.event_id || title, title });
      }
    });

    if (list.length === 0) {
      list.push({ id: 'The 4th Press Conference', title: 'The 4th Press Conference' });
    }

    return list;
  },

  /**
   * Admin: Update registration status or notes
   */
  async updateStatus(id, status, notes = undefined) {
    const payload = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabase
      .from('event_registrations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[registrationService] updateStatus error:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin: Delete a registration record
   */
  async deleteRegistration(id) {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[registrationService] deleteRegistration error:', error);
      throw error;
    }

    return true;
  },

  /**
   * Admin: Resend confirmation email via secure serverless API
   */
  async resendConfirmationEmail(registrationId) {
    const apiBase = getApiBaseUrl();
    const endpoint = `${apiBase}/api/send-registration-confirmation`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationId }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to resend confirmation email');
    }

    return result;
  },
};
