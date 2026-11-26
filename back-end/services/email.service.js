/**
 * Email Service (Resend Integration)
 *
 * Handles sending transactional emails via Resend SDK.
 * Anti-spam measures:
 *   - Sends both HTML + plain text (multipart/alternative)
 *   - Sets reply-to header
 *   - Proper subject line (no ALL CAPS, no spam words)
 *   - List-Unsubscribe header (even for transactional)
 *   - Tags for Resend deliverability tracking
 *
 * Sender: Khaleeji Tour <support@khaleejitour.com>
 */
const { Resend } = require('resend');
const {
  generateBookingConfirmationHtml,
  generateBookingConfirmationText,
} = require('../templates/bookingConfirmation');
const {
  generateAdminBookingNotificationHtml,
  generateAdminBookingNotificationText,
} = require('../templates/adminBookingNotification');

// Initialize Resend with API key from environment
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_YOUR_API_KEY_HERE') {
    console.warn('[EmailService] RESEND_API_KEY is not configured. Email dispatch simulated.');
    return null;
  }
  return new Resend(apiKey);
};

const emailService = {
  /**
   * Send booking confirmation email with ticket and QR code to customer.
   * Includes both HTML and plain text versions for maximum deliverability.
   *
   * @param {Object} params
   * @param {Object} params.booking - Booking record (may be partial from RPC)
   * @param {Object} params.ticket - Ticket record with qr_code_url
   * @param {string} params.bookingId - Booking UUID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendBookingConfirmationEmail({ booking, ticket, bookingId, force = false }) {
    try {
      const targetBookingId = bookingId || booking?.id || booking?.booking_id;
      if (!targetBookingId) {
        console.warn('[EmailService] No bookingId provided for confirmation email');
        return { success: false, reason: 'no_booking_id' };
      }

      // Fetch full booking with relations if not already populated
      let fullBooking = booking || {};
      const bookingService = require('./booking.service');
      if (!fullBooking?.events || !fullBooking?.booking_items || !fullBooking?.customer_email) {
        const fetched = await bookingService.getBookingById(targetBookingId);
        if (fetched) {
          fullBooking = { ...fullBooking, ...fetched };
        }
      }

      const recipientEmail = fullBooking?.customer_email || booking?.customer_email;
      if (!recipientEmail) {
        console.warn('[EmailService] No recipient email found for booking:', targetBookingId);
        return { success: false, reason: 'no_recipient_email' };
      }

      // Idempotency: Prevent duplicate emails unless forced
      if (fullBooking?.confirmation_email_sent_at && !force) {
        console.log(`[EmailService] Booking confirmation already sent at ${fullBooking.confirmation_email_sent_at} for ${targetBookingId}`);
        return { success: true, already_sent: true };
      }

      // Fetch ticket if not provided
      let finalTicket = ticket;
      if (!finalTicket?.ticket_code) {
        if (fullBooking?.tickets && fullBooking.tickets.length > 0) {
          finalTicket = fullBooking.tickets[0];
        } else {
          const { supabaseAdmin } = require('./supabaseAdmin');
          const { data: tRow } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('booking_id', targetBookingId)
            .maybeSingle();
          if (tRow) finalTicket = tRow;
        }
      }

      const ticketCode = finalTicket?.ticket_code || 'KT-TICKET';

      const event = fullBooking?.events || {};
      const eventTitle = event?.title_en || event?.title_ar || 'Khaleeji Tour Event';
      const eventVenue = event?.venue_en || event?.venue_ar || 'Venue Location';
      const eventDate = (() => {
        if (!event?.start_date) return 'To Be Announced';
        const start = new Date(event.start_date);
        const timeZone = 'UTC'; // Preserves exact literal event time entered during creation

        const dateFormatted = start.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone,
        });

        const startTimeFormatted = start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone,
        });

        if (event?.end_date) {
          const end = new Date(event.end_date);
          const endTimeFormatted = end.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone,
          });
          return `${dateFormatted} at ${startTimeFormatted} - ${endTimeFormatted}`;
        }

        return `${dateFormatted} at ${startTimeFormatted}`;
      })();

      // QR Payload for scanners
      const qrPayload = finalTicket?.qr_code_data || JSON.stringify({
        ticketCode,
        bookingId: targetBookingId,
        issuedAt: new Date().toISOString(),
      });

      // Public HTTPS QR Code URL — 100% compatible with Gmail proxy and mobile email clients
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrPayload)}&size=320&margin=1&ecLevel=H&format=png`;

      // Format tables breakdown
      const tables = (fullBooking?.booking_items || []).map((item) => {
        const rawCode = (item.tables?.table_code || item.tables?.svg_element_id || '').toString().trim();
        const cleanCode = rawCode.replace(/^#+/, '');
        return {
          table_name: cleanCode ? `Table #${cleanCode}` : 'Reserved Table',
          table_code: cleanCode,
          seats_count: item.seats_count || 1,
          unit_price: item.unit_price || 0,
        };
      });

      const totalAmount = fullBooking?.total_amount || 0;
      const currency = fullBooking?.currency || 'CAD';
      const ticketUrl = `https://www.khaleejitour.com/booking/success?booking_id=${targetBookingId}`;
      const customerName = fullBooking?.customer_name || 'Valued Guest';

      const templateParams = {
        customerName,
        eventTitle,
        eventDate,
        eventVenue,
        ticketCode,
        qrImageUrl,
        tables,
        totalAmount,
        currency,
        ticketUrl,
      };

      // Generate both HTML and plain text versions (multipart = better deliverability)
      const htmlContent = generateBookingConfirmationHtml(templateParams);
      const textContent = generateBookingConfirmationText(templateParams);

      const resend = getResendClient();
      if (!resend) {
        console.log(`[EmailService] (Simulated) Would send to: ${recipientEmail} | Ticket: ${ticketCode}`);
        return { success: true, simulated: true };
      }

      const response = await resend.emails.send({
        from: 'Khaleeji Tour <support@khaleejitour.com>',
        to: [recipientEmail],
        reply_to: 'support@khaleejitour.com',
        subject: `Booking Confirmed - ${eventTitle} (${ticketCode})`,
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': '<mailto:support@khaleejitour.com?subject=unsubscribe>',
          'X-Entity-Ref-ID': targetBookingId,
        },
        tags: [
          { name: 'category', value: 'booking_confirmation' },
          { name: 'ticket_code', value: ticketCode },
        ],
      });

      if (response?.error) {
        console.error(`[EmailService] Resend API error sending to ${recipientEmail}:`, response.error);
        return { success: false, error: response.error.message || response.error };
      }

      // Mark confirmation_email_sent_at in database using SECURITY DEFINER RPC
      const { supabaseAdmin } = require('./supabaseAdmin');
      try {
        await supabaseAdmin.rpc('mark_booking_email_sent', { p_booking_id: targetBookingId });
      } catch (markErr) {
        console.warn('[EmailService] Could not update confirmation_email_sent_at via RPC:', markErr?.message);
        await supabaseAdmin
          .from('bookings')
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq('id', targetBookingId);
      }

      console.log(`[EmailService] Email sent to ${recipientEmail}. Resend ID: ${response?.data?.id || 'N/A'}`);
      return { success: true, data: response?.data };
    } catch (err) {
      console.error('[EmailService] Error sending booking confirmation:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send new ticket booking notification to administrators
   *
   * @param {Object} params
   * @param {Object} [params.booking] - Booking record
   * @param {Object} [params.ticket] - Ticket record
   * @param {string} [params.bookingId] - Booking UUID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendAdminBookingNotification({ booking, ticket, bookingId, paymentMethod }) {
    try {
      const configuredAdmins = process.env.ADMIN_NOTIFICATION_EMAILS
        ? process.env.ADMIN_NOTIFICATION_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
        : [];

      if (!configuredAdmins.length) {
        console.warn('[EmailService] No admin emails configured for booking notification.');
        return { success: false, reason: 'no_admin_recipients' };
      }

      const targetBookingId = bookingId || booking?.id || booking?.booking_id;

      // Fetch full booking with relations if not already populated
      let fullBooking = booking || {};
      if (!fullBooking?.events || !fullBooking?.booking_items || !fullBooking?.customer_name) {
        if (targetBookingId) {
          const bookingService = require('./booking.service');
          const fetched = await bookingService.getBookingById(targetBookingId);
          if (fetched) fullBooking = { ...fullBooking, ...fetched };
        }
      }

      // Fetch ticket if not provided
      let finalTicket = ticket;
      if (!finalTicket?.ticket_code) {
        if (fullBooking?.tickets && fullBooking.tickets.length > 0) {
          finalTicket = fullBooking.tickets[0];
        } else if (targetBookingId) {
          const { supabaseAdmin } = require('./supabaseAdmin');
          const { data: tRow } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('booking_id', targetBookingId)
            .maybeSingle();
          if (tRow) finalTicket = tRow;
        }
      }

      const event = fullBooking?.events || {};
      const eventTitle = event?.title_en || event?.title_ar || 'Khaleeji Tour Event';
      const eventVenue = event?.venue_en || event?.venue_ar || 'Venue Location';
      const eventDate = (() => {
        if (!event?.start_date) return 'To Be Announced';
        const start = new Date(event.start_date);
        const timeZone = 'UTC';

        const dateFormatted = start.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone,
        });

        const startTimeFormatted = start.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone,
        });

        if (event?.end_date) {
          const end = new Date(event.end_date);
          const endTimeFormatted = end.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone,
          });
          return `${dateFormatted} at ${startTimeFormatted} - ${endTimeFormatted}`;
        }

        return `${dateFormatted} at ${startTimeFormatted}`;
      })();

      const ticketCode = finalTicket?.ticket_code || 'KT-TICKET';

      // Format tables breakdown
      const tables = (fullBooking?.booking_items || []).map((item) => {
        const rawCode = (item.tables?.table_code || item.tables?.svg_element_id || '').toString().trim();
        const cleanCode = rawCode.replace(/^#+/, '');
        return {
          table_name: cleanCode ? `Table #${cleanCode}` : 'Reserved Table',
          table_code: cleanCode,
          seats_count: item.seats_count || 1,
          unit_price: item.unit_price || 0,
        };
      });

      const totalAmount = fullBooking?.total_amount || 0;
      const currency = fullBooking?.currency || 'CAD';
      const customerName = fullBooking?.customer_name || 'Valued Customer';
      const customerEmail = fullBooking?.customer_email || '';
      const customerPhone = fullBooking?.customer_phone || '';
      const stripePaymentIntentId = fullBooking?.stripe_payment_intent_id || '';

      // Resolve payment method (e.g. 'Cash', 'WhatsApp', 'Bank Transfer', 'Stripe')
      let resolvedPaymentMethod = paymentMethod;
      if (!resolvedPaymentMethod) {
        if (fullBooking?.payment_method) {
          resolvedPaymentMethod = fullBooking.payment_method;
        } else if (fullBooking?.stripe_payment_intent_id) {
          const pi = String(fullBooking.stripe_payment_intent_id);
          if (pi.startsWith('OFFLINE_')) {
            const raw = pi.replace(/^OFFLINE_/, '');
            const methodKey = raw.split('_')[0] || '';
            if (methodKey.toUpperCase() === 'WHATSAPP') resolvedPaymentMethod = 'WhatsApp';
            else if (methodKey.toUpperCase() === 'CASH') resolvedPaymentMethod = 'Cash';
            else if (methodKey.toUpperCase().includes('BANK')) resolvedPaymentMethod = 'Bank Transfer';
            else resolvedPaymentMethod = methodKey || 'Offline / Manual';
          } else if (pi.startsWith('pi_') || pi.startsWith('cs_')) {
            resolvedPaymentMethod = 'Stripe';
          }
        }
      }
      if (!resolvedPaymentMethod) {
        resolvedPaymentMethod = 'Stripe';
      }

      const templateParams = {
        customerName,
        customerEmail,
        customerPhone,
        ticketCode,
        bookingId: targetBookingId || '',
        eventTitle,
        eventDate,
        eventVenue,
        tables,
        totalAmount,
        currency,
        paymentMethod: resolvedPaymentMethod,
        stripePaymentIntentId,
        bookedAt: fullBooking?.created_at || new Date().toISOString(),
      };

      const htmlContent = generateAdminBookingNotificationHtml(templateParams);
      const textContent = generateAdminBookingNotificationText(templateParams);

      const resend = getResendClient();
      if (!resend) {
        console.log(`[EmailService] (Simulated Admin Notification) Would send to: ${configuredAdmins.join(', ')} | Ticket: ${ticketCode} | Method: ${resolvedPaymentMethod}`);
        return { success: true, simulated: true };
      }

      const isManual = resolvedPaymentMethod && resolvedPaymentMethod.toLowerCase() !== 'stripe';
      const subjectTag = isManual ? `[Manual Booking - ${resolvedPaymentMethod}]` : `[New Booking]`;
      const emailSubject = `${subjectTag} ${customerName} — ${eventTitle} (${ticketCode}) — $${Number(totalAmount).toFixed(2)} ${currency}`;

      const response = await resend.emails.send({
        from: 'Khaleeji Tour Notifications <support@khaleejitour.com>',
        to: configuredAdmins,
        reply_to: customerEmail || 'support@khaleejitour.com',
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Entity-Ref-ID': targetBookingId || '',
          'X-Customer-Email': customerEmail || '',
        },
        tags: [
          { name: 'category', value: 'admin_booking_notification' },
          { name: 'ticket_code', value: ticketCode },
          { name: 'payment_method', value: resolvedPaymentMethod.replace(/[^a-zA-Z0-9_-]/g, '_') },
        ],
      });

      if (response?.error) {
        console.warn('[EmailService] Resend rejected admin booking notification:', response.error.message);
        return { success: false, error: response.error.message };
      }

      console.log(`[EmailService] Admin booking notification sent to ${configuredAdmins.join(', ')} for ${ticketCode}. Resend ID: ${response?.data?.id || 'OK'}`);
      return { success: true, data: response?.data };
    } catch (err) {
      console.error('[EmailService] Error sending admin booking notification:', err);
      return { success: false, error: err.message };
    }
  },
};

module.exports = emailService;
