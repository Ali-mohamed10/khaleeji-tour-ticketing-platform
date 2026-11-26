/**
 * Registration Service
 *
 * Handles business logic for event registrations:
 *   - Inserting new registrations into Supabase
 *   - Automatic sequential registration IDs (PC4-2026-XXXX)
 *   - Dispatching transactional confirmation emails via Resend
 *   - Admin listing, filtering, search, status updates, and deletions
 */
const QRCode = require('qrcode');
const { Resend } = require('resend');
const { supabaseAdmin } = require('./supabaseAdmin');
const {
  generateRegistrationConfirmationHtml,
  generateRegistrationConfirmationText,
} = require('../templates/registrationConfirmation');
const {
  generateAdminRegistrationNotificationHtml,
  generateAdminRegistrationNotificationText,
} = require('../templates/adminRegistrationNotification');

// Helper to get Resend instance
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_YOUR_API_KEY_HERE') {
    console.warn('[RegistrationService] RESEND_API_KEY is not configured. Email dispatch simulated.');
    return null;
  }
  return new Resend(apiKey);
};

const registrationService = {
  /**
   * Submit a new event registration
   *
   * @param {Object} data
   * @returns {Promise<{success: boolean, registration: Object, emailStatus: string}>}
   */
  async createRegistration(data) {
    const {
      fullName,
      email,
      phoneNumber,
      city,
      category,
      organizationName,
      jobTitle,
      discoverySource,
      preferredLanguage = 'ar',
      eventId = null,
      eventTitle = 'The 4th Press Conference',
      notes = null,
      questionTopic = null,
      questionText = null,
    } = data;

    // Validate required fields
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new Error('Full name is required');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 6) {
      throw new Error('Valid phone number is required');
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      throw new Error('Registration category is required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();
    const cleanName = fullName.trim();
    const cleanTopic = questionTopic ? String(questionTopic).trim() : null;
    const cleanQuestion = questionText ? String(questionText).trim() : null;

    // Call stored procedure to securely insert and return record
    let inserted = null;
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('submit_event_registration', {
      p_full_name: cleanName,
      p_email: cleanEmail,
      p_phone_number: cleanPhone,
      p_city: (city || '').trim() || null,
      p_category: category.trim(),
      p_organization_name: (organizationName || '').trim() || null,
      p_job_title: (jobTitle || '').trim() || null,
      p_discovery_source: (discoverySource || '').trim() || null,
      p_preferred_language: ['ar', 'en', 'both'].includes(preferredLanguage) ? preferredLanguage : 'ar',
      p_event_id: eventId || null,
      p_event_title: eventTitle || 'The 4th Press Conference',
      p_notes: notes || null,
      p_question_topic: cleanTopic,
      p_question_text: cleanQuestion,
    });

    if (rpcError) {
      console.error('[RegistrationService] RPC Insert error:', rpcError);
      throw new Error(rpcError?.message || 'Failed to save registration');
    }

    inserted = rpcData;

    console.log(`[RegistrationService] Created registration ${inserted.registration_number} for ${inserted.email}`);

    // Generate QR Code containing the standard registration payload
    const qrPayload = JSON.stringify({
      id: inserted.id,
      regNum: inserted.registration_number,
      name: inserted.full_name,
      email: inserted.email,
      event: inserted.event_title || 'The 4th Press Conference',
    });

    let qrCodeUrl = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#1B120F',
          light: '#FFFFFF',
        },
      });
    } catch (qrErr) {
      console.warn('[RegistrationService] QRCode generation failed, falling back to QuickChart:', qrErr.message);
      qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=360&margin=1&ecLevel=H&format=png`;
    }

    if (qrCodeUrl) {
      inserted.qr_code_url = qrCodeUrl;
      try {
        await supabaseAdmin.rpc('update_registration_qr_code', {
          p_registration_id: inserted.id,
          p_qr_code_url: qrCodeUrl,
        });
      } catch (qrSaveErr) {
        console.warn('[RegistrationService] Failed to update QR via RPC, trying direct update:', qrSaveErr.message);
        await supabaseAdmin
          .from('event_registrations')
          .update({ qr_code_url: qrCodeUrl })
          .eq('id', inserted.id);
      }
    }

    // Send attendee confirmation email
    let emailStatus = 'pending';
    try {
      const emailResult = await this.sendConfirmationEmail(inserted.id, inserted);
      emailStatus = emailResult.success ? 'sent' : 'failed';
    } catch (emailErr) {
      console.error('[RegistrationService] Email send error:', emailErr);
      emailStatus = 'failed';
    }

    // Trigger Admin Notification Email to ali.dev400@gmail.com & ayatalrebeh@gmail.com (Non-blocking)
    this.sendAdminRegistrationNotification(inserted).catch((adminErr) => {
      console.error('[RegistrationService] Non-blocking admin notification error:', adminErr);
    });

    // Attach latest email status to response
    inserted.confirmation_email_status = emailStatus;
    if (emailStatus === 'sent') {
      inserted.confirmation_email_sent_at = new Date().toISOString();
    }

    return {
      success: true,
      registration: inserted,
      emailStatus,
    };
  },

  /**
   * Send or resend registration confirmation email
   *
   * @param {string} registrationId
   * @param {Object} [regData] - Optional pre-loaded registration record
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendConfirmationEmail(registrationId, regData = null) {
    try {
      let reg = regData;

      if (!reg) {
        // Try secure RPC first
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('get_event_registration_by_id', {
          p_id: registrationId,
        });

        if (rpcData && !rpcErr) {
          reg = rpcData;
        } else {
          // Direct table query fallback
          const { data: tableData } = await supabaseAdmin
            .from('event_registrations')
            .select('*')
            .eq('id', registrationId)
            .single();
          reg = tableData;
        }
      }

      if (!reg) {
        throw new Error(`Registration not found: ${registrationId}`);
      }

      const resend = getResendClient();

      // QuickChart QR Code URL
      const qrPayload = JSON.stringify({
        id: reg.id,
        regNum: reg.registration_number,
        name: reg.full_name,
        email: reg.email,
        event: reg.event_title,
      });
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=360&margin=1&ecLevel=H&format=png`;

      const templateParams = {
        fullName: reg.full_name,
        registrationNumber: reg.registration_number,
        eventTitle: reg.event_title || 'The 4th Press Conference',
        eventDate: 'Wednesday, September 23, 2026',
        eventTime: '6:00 PM – 9:00 PM',
        eventVenue: 'HILM Venues – Mississauga, Ontario',
        category: reg.category,
        city: reg.city || '',
        organizationName: reg.organization_name || '',
        jobTitle: reg.job_title || '',
        qrImageUrl,
        preferredLanguage: reg.preferred_language,
      };

      const htmlContent = generateRegistrationConfirmationHtml(templateParams);
      const textContent = generateRegistrationConfirmationText(templateParams);

      if (!resend) {
        console.log(`[RegistrationService] (Simulated) Sent to ${reg.email} | RegNum: ${reg.registration_number}`);
        await supabaseAdmin
          .from('event_registrations')
          .update({
            confirmation_email_status: 'sent',
            confirmation_email_sent_at: new Date().toISOString(),
          })
          .eq('id', reg.id);
        return { success: true, simulated: true };
      }

      const response = await resend.emails.send({
        from: 'Khaleeji Tour <support@khaleejitour.com>',
        to: [reg.email],
        reply_to: 'support@khaleejitour.com',
        subject: `Registration Confirmation — ${reg.event_title} (${reg.registration_number})`,
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': '<mailto:support@khaleejitour.com?subject=unsubscribe>',
          'X-Registration-ID': reg.registration_number,
        },
        tags: [
          { name: 'category', value: 'event_registration' },
          { name: 'reg_num', value: reg.registration_number },
        ],
      });

      if (response?.error || !response?.data?.id) {
        const errorMsg = response?.error?.message || 'Resend failed to accept email';
        console.warn(`[RegistrationService] Resend delivery rejected for ${reg.email}:`, errorMsg);
        await supabaseAdmin.rpc('update_registration_email_status', {
          p_registration_id: reg.id,
          p_status: 'failed',
        });
        return { success: false, error: errorMsg };
      }

      console.log(`[RegistrationService] Confirmation email accepted by Resend for ${reg.email}. Resend ID: ${response.data.id}`);

      // Update database status via secure RPC
      await supabaseAdmin.rpc('update_registration_email_status', {
        p_registration_id: reg.id,
        p_status: 'sent',
        p_sent_at: new Date().toISOString(),
      });

      return { success: true, data: response.data };
    } catch (err) {
      console.error('[RegistrationService] Failed to send email:', err);

      // Record failure state via secure RPC
      await supabaseAdmin.rpc('update_registration_email_status', {
        p_registration_id: registrationId,
        p_status: 'failed',
      });

      return { success: false, error: err.message };
    }
  },

  /**
   * Send new registration notification email to administrators
   * Recipients configured via ADMIN_NOTIFICATION_EMAILS env variable
   *
   * @param {Object} reg - Full registration record
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendAdminRegistrationNotification(reg) {
    if (!reg) return { success: false, error: 'No registration data provided' };

    // Target admin recipients
    const configuredAdmins = process.env.ADMIN_NOTIFICATION_EMAILS
      ? process.env.ADMIN_NOTIFICATION_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
      : [];

    if (!configuredAdmins.length) {
      console.warn('[RegistrationService] No admin emails configured for notification.');
      return { success: false, reason: 'no_admin_recipients' };
    }

    try {
      const resend = getResendClient();

      const templateParams = {
        fullName: reg.full_name,
        registrationNumber: reg.registration_number,
        email: reg.email,
        phoneNumber: reg.phone_number,
        category: reg.category,
        city: reg.city || '',
        organizationName: reg.organization_name || '',
        jobTitle: reg.job_title || '',
        discoverySource: reg.discovery_source || '',
        preferredLanguage: reg.preferred_language || 'ar',
        questionTopic: reg.question_topic || '',
        questionText: reg.question_text || '',
        eventTitle: reg.event_title || 'The 4th Press Conference',
        registeredAt: reg.created_at || new Date().toISOString(),
      };

      const htmlContent = generateAdminRegistrationNotificationHtml(templateParams);
      const textContent = generateAdminRegistrationNotificationText(templateParams);

      if (!resend) {
        console.log(`[RegistrationService] (Simulated Admin Notification) Would send to: ${configuredAdmins.join(', ')} for ${reg.registration_number}`);
        return { success: true, simulated: true };
      }

      const response = await resend.emails.send({
        from: 'Khaleeji Tour Notifications <support@khaleejitour.com>',
        to: configuredAdmins,
        reply_to: reg.email,
        subject: `[New Registration] ${reg.full_name} (${reg.category}) — ${reg.registration_number}`,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Entity-Ref-ID': reg.registration_number,
          'X-Attendee-Email': reg.email,
        },
        tags: [
          { name: 'category', value: 'admin_registration_notification' },
          { name: 'registration_number', value: reg.registration_number },
        ],
      });

      if (response?.error) {
        console.warn(`[RegistrationService] Resend rejected admin notification:`, response.error.message);
        return { success: false, error: response.error.message };
      }

      console.log(`[RegistrationService] Admin notification dispatched to ${configuredAdmins.join(', ')} for ${reg.registration_number}. Resend ID: ${response?.data?.id || 'OK'}`);
      return { success: true, data: response?.data };
    } catch (err) {
      console.error('[RegistrationService] Error sending admin notification:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Admin: List registrations with search, filter, and pagination
   */
  async getRegistrations({
    search = '',
    status = '',
    emailStatus = '',
    category = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    let query = supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact' });

    // Search by name, email, phone, or registration number
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},phone_number.ilike.${term},registration_number.ilike.${term},organization_name.ilike.${term}`);
    }

    // Filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (emailStatus && emailStatus !== 'all') {
      query = query.eq('confirmation_email_status', emailStatus);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Sorting
    query = query.order(sortBy || 'created_at', { ascending: sortOrder === 'asc' });

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[RegistrationService] getRegistrations error:', error);
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
   * Admin: Update registration status or notes
   */
  async updateRegistrationStatus(id, { status, notes }) {
    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[RegistrationService] updateRegistrationStatus error:', error);
      throw error;
    }

    return data;
  },

  /**
   * Admin: Delete registration
   */
  async deleteRegistration(id) {
    const { error } = await supabaseAdmin
      .from('event_registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[RegistrationService] deleteRegistration error:', error);
      throw error;
    }

    return { success: true };
  },

  /**
   * Admin: Get statistics summary
   */
  async getStats() {
    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .select('id, status, confirmation_email_status, category');

    if (error) {
      console.error('[RegistrationService] getStats error:', error);
      throw error;
    }

    const items = data || [];
    const total = items.length;
    const registered = items.filter((i) => i.status === 'registered').length;
    const attended = items.filter((i) => i.status === 'attended').length;
    const cancelled = items.filter((i) => i.status === 'cancelled').length;
    const emailsSent = items.filter((i) => i.confirmation_email_status === 'sent').length;
    const emailsFailed = items.filter((i) => i.confirmation_email_status === 'failed').length;

    return {
      total,
      registered,
      attended,
      cancelled,
      emailsSent,
      emailsFailed,
    };
  },
};

module.exports = registrationService;
