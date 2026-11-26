/**
 * Ticket Service
 *
 * Generates unique tickets & QR codes upon successful payment confirmation,
 * handles gate check-in & verification, and provides real-time event gate analytics.
 */
const QRCode = require('qrcode');
const { supabaseAdmin } = require('./supabaseAdmin');

const ticketService = {
  /**
   * Generate unique ticket code
   * @returns {string} e.g. "KT-8F3A-9C2E"
   */
  generateTicketCode() {
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KT-${randomHex()}-${randomHex()}`;
  },

  /**
   * Generate QR Code as Data URL
   * @param {string} text - Payload to encode in QR Code
   * @returns {Promise<string>} Data URL (base64 string)
   */
  async generateQRCodeDataUrl(text) {
    return QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#1B120F',
        light: '#FFFFFF',
      },
    });
  },

  /**
   * Issue ticket for a confirmed booking
   * @param {Object} params
   * @param {string} params.bookingId
   * @param {string} params.customerName
   * @returns {Promise<Object>} Created ticket record
   */
  async issueTicketForBooking({ bookingId, customerName }) {
    // Check if ticket already exists for this booking (idempotency)
    const { data: existingTicket } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingTicket) {
      return existingTicket;
    }

    const ticketCode = this.generateTicketCode();
    const qrPayload = JSON.stringify({
      ticketCode,
      bookingId,
      issuedAt: new Date().toISOString(),
    });

    const qrDataUrl = await this.generateQRCodeDataUrl(qrPayload);

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert([
        {
          booking_id: bookingId,
          ticket_code: ticketCode,
          customer_name: customerName || 'Valued Guest',
          qr_code_url: qrDataUrl,
          qr_code_data: qrPayload,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }

    return ticket;
  },

  /**
   * Verify and Check-in an event registration (e.g. Press Conference)
   * @param {Object} params
   * @param {string} [params.code]
   * @param {string} [params.regId]
   * @param {string} [params.regNum]
   * @param {boolean} [params.checkIn]
   * @param {string} [params.adminId]
   */
  async verifyRegistration({ code, regId = null, regNum = null, checkIn = true, adminId = null }) {
    const lookupCode = regNum || regId || code;
    if (lookupCode) {
      try {
        const { data, error } = await supabaseAdmin.rpc('verify_and_check_in_registration', {
          p_code: String(lookupCode).trim(),
          p_check_in: checkIn,
          p_admin_id: adminId,
        });

        if (!error && data && data.status !== 'INVALID') {
          return data;
        }
        if (!error && data && data.status === 'INVALID' && !regId && !regNum) {
          return data;
        }
      } catch (rpcErr) {
        console.warn('RPC verify_and_check_in_registration exception, falling back to JS logic:', rpcErr.message);
      }
    }

    let query = supabaseAdmin.from('event_registrations').select('*');

    if (regId && regNum) {
      query = query.or(`id.eq.${regId},registration_number.ilike.${regNum}`);
    } else if (regId) {
      query = query.eq('id', regId);
    } else if (regNum) {
      query = query.ilike('registration_number', regNum);
    } else if (code) {
      const clean = String(code).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
      if (isUuid) {
        query = query.or(`id.eq.${clean},registration_number.ilike.${clean}`);
      } else {
        query = query.ilike('registration_number', clean);
      }
    } else {
      return {
        status: 'INVALID',
        message: 'No registration code provided.',
        isRegistration: true,
      };
    }

    const { data: registration, error } = await query.maybeSingle();

    if (error || !registration) {
      return {
        status: 'INVALID',
        message: 'Registration not found. Invalid registration number or QR code.',
        isRegistration: true,
      };
    }

    if (registration.status === 'cancelled') {
      return {
        status: 'INVALID',
        message: 'This registration has been cancelled.',
        isRegistration: true,
        registration,
      };
    }

    if (registration.status === 'attended') {
      return {
        status: 'ALREADY_USED',
        message: 'Registration has already been used for entry.',
        used_at: registration.updated_at,
        isRegistration: true,
        registration: {
          id: registration.id,
          registration_number: registration.registration_number,
          full_name: registration.full_name,
          email: registration.email,
          phone_number: registration.phone_number,
          category: registration.category,
          event_title: registration.event_title,
          organization_name: registration.organization_name,
          job_title: registration.job_title,
          status: registration.status,
        },
        ticket: {
          id: registration.id,
          ticket_code: registration.registration_number,
          customer_name: registration.full_name,
          is_used: true,
          used_at: registration.updated_at,
          created_at: registration.created_at,
        },
        event: {
          id: registration.event_id || 'press-conference',
          title_en: registration.event_title || 'The 4th Press Conference',
          title_ar: 'المؤتمر الصحفي الرابع',
          venue_en: 'HILM Venues – Mississauga, Ontario',
          venue_ar: 'قاعات حِلم – ميسيساغا، أونتاريو',
        },
        tables: [
          {
            table_name: registration.category || 'Guest Registration',
            seats_count: 1,
          },
        ],
      };
    }

    const now = new Date().toISOString();
    if (checkIn) {
      await supabaseAdmin
        .from('event_registrations')
        .update({
          status: 'attended',
          updated_at: now,
        })
        .eq('id', registration.id);
    }

    return {
      status: 'VALID',
      message: checkIn
        ? 'Registration verified & Checked in successfully!'
        : 'Registration is valid and ready for check-in.',
      checked_in_now: checkIn,
      used_at: now,
      isRegistration: true,
      registration: {
        id: registration.id,
        registration_number: registration.registration_number,
        full_name: registration.full_name,
        email: registration.email,
        phone_number: registration.phone_number,
        category: registration.category,
        event_title: registration.event_title,
        organization_name: registration.organization_name,
        job_title: registration.job_title,
        status: checkIn ? 'attended' : 'registered',
      },
      ticket: {
        id: registration.id,
        ticket_code: registration.registration_number,
        customer_name: registration.full_name,
        is_used: checkIn,
        used_at: checkIn ? now : null,
        created_at: registration.created_at,
      },
      event: {
        id: registration.event_id || 'press-conference',
        title_en: registration.event_title || 'The 4th Press Conference',
        title_ar: 'المؤتمر الصحفي الرابع',
        venue_en: 'HILM Venues – Mississauga, Ontario',
        venue_ar: 'قاعات حِلم – ميسيساغا، أونتاريو',
      },
      tables: [
        {
          table_name: registration.category || 'Guest Registration',
          seats_count: 1,
        },
      ],
    };
  },

  /**
   * Verify and Check-in a ticket or registration atomically
   * @param {Object} params
   * @param {string} params.ticketCode
   * @param {boolean} params.checkIn - If true, marks as used
   * @param {string} [params.adminId]
   */
  async verifyAndCheckIn({ ticketCode, checkIn = true, adminId = null }) {
    if (!ticketCode) {
      throw new Error('Ticket code is required');
    }

    let raw = String(ticketCode).trim();
    let isReg = false;
    let regNum = null;
    let regId = null;

    // 1. Check if JSON payload (from camera QR scanner)
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.regNum || parsed.registration_number || (parsed.id && (parsed.event || parsed.name))) {
          isReg = true;
          regNum = parsed.regNum || parsed.registration_number || null;
          regId = parsed.id || null;
        } else if (parsed.ticketCode || parsed.ticket_code) {
          raw = parsed.ticketCode || parsed.ticket_code;
        }
      } catch {
        // use as-is
      }
    }

    // 2. Check if prefix is PC4- or REG-
    if (!isReg && (raw.toUpperCase().startsWith('PC4-') || raw.toUpperCase().startsWith('REG-'))) {
      isReg = true;
      regNum = raw;
    }

    if (isReg) {
      return this.verifyRegistration({
        code: raw,
        regId,
        regNum,
        checkIn,
        adminId,
      });
    }

    // 3. Try RPC function for regular tickets first
    try {
      const { data, error } = await supabaseAdmin.rpc('verify_and_check_in_ticket', {
        p_ticket_code: raw.trim(),
        p_check_in: checkIn,
        p_admin_id: adminId,
      });

      if (!error && data && data.status !== 'INVALID') {
        return data;
      }
      if (error) {
        console.warn('RPC verify_and_check_in_ticket failed or not migrated, falling back to JS logic:', error.message);
      }
    } catch (rpcErr) {
      console.warn('RPC exception, using JS fallback:', rpcErr.message);
    }

    // 4. JS Fallback for tickets
    const cleanCode = raw.trim().toUpperCase();
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .select('*, bookings(*, events(*), booking_items(*, tables(*)))')
      .ilike('ticket_code', cleanCode)
      .maybeSingle();

    if (ticket) {
      const booking = ticket.bookings;
      if (!booking) {
        return {
          status: 'INVALID',
          message: 'Associated booking not found.',
        };
      }

      if (booking.status !== 'PAID') {
        return {
          status: 'NOT_PAID',
          booking_status: booking.status,
          message: 'Payment has not been confirmed for this ticket.',
        };
      }

      const tables = (booking.booking_items || []).map((bi) => ({
        table_name: bi.tables?.name || `Table ${bi.tables?.table_code || bi.tables?.table_number || bi.tables?.svg_element_id || 'N/A'}`,
        table_number: bi.tables?.table_number || bi.tables?.table_code,
        seats_count: bi.seats_count,
        price: bi.unit_price,
      }));

      if (ticket.is_used) {
        return {
          status: 'ALREADY_USED',
          message: 'Ticket has already been used for entry.',
          used_at: ticket.used_at,
          ticket,
          booking,
          event: booking.events,
          tables,
          isRegistration: false,
        };
      }

      const now = new Date().toISOString();
      if (checkIn) {
        await supabaseAdmin
          .from('tickets')
          .update({
            is_used: true,
            used_at: now,
            checked_in_by: adminId,
          })
          .eq('id', ticket.id);
      }

      return {
        status: 'VALID',
        message: checkIn ? 'Ticket verified & Checked in successfully!' : 'Ticket is valid and ready for check-in.',
        checked_in_now: checkIn,
        used_at: now,
        ticket: { ...ticket, is_used: checkIn, used_at: checkIn ? now : null },
        booking,
        event: booking.events,
        tables,
        isRegistration: false,
      };
    }

    // 5. Fallback: Check event_registrations in case code is a registration ID or number without standard prefix
    const regFallback = await this.verifyRegistration({
      code: raw,
      checkIn,
      adminId,
    });
    if (regFallback && regFallback.status !== 'INVALID') {
      return regFallback;
    }

    return {
      status: 'INVALID',
      message: 'Ticket or registration not found. Invalid code.',
    };
  },

  /**
   * Get all attendees and live gate check-in statistics for an event (tickets and/or registrations)
   * @param {string} [eventId] - Optional event ID filter ('press-conference' or UUID)
   * @param {string} [source] - 'all' | 'tickets' | 'registrations'
   */
  async getEventAttendeesAndStats(eventId = null, source = 'all') {
    let attendees = [];
    let totalTickets = 0;
    let totalSeats = 0;
    let checkedInCount = 0;

    const isConferenceOnly = eventId === 'press-conference';

    // 1. Query paid Tickets (unless source is registrations only or eventId is press-conference)
    if (source !== 'registrations' && !isConferenceOnly) {
      let query = supabaseAdmin
        .from('tickets')
        .select(`
          id,
          ticket_code,
          customer_name,
          is_used,
          used_at,
          created_at,
          bookings!inner (
            id,
            event_id,
            status,
            total_amount,
            currency,
            customer_name,
            customer_email,
            customer_phone,
            events (
              id,
              title_en,
              title_ar,
              venue_en,
              venue_ar,
              start_date,
              end_date
            ),
            booking_items (
              id,
              seats_count,
              unit_price,
              tables (
                id,
                table_code,
                svg_element_id,
                category,
                capacity
              )
            )
          )
        `)
        .eq('bookings.status', 'PAID')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('bookings.event_id', eventId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching ticket attendees:', error);
      } else {
        const ticketList = data || [];
        totalTickets += ticketList.length;

        ticketList.forEach((item) => {
          const booking = item.bookings;
          const tables = (booking?.booking_items || []).map((bi) => ({
            table_name: bi.tables?.name || `Table ${bi.tables?.table_code || bi.tables?.table_number || 'N/A'}`,
            table_code: bi.tables?.table_code,
            seats_count: bi.seats_count || 1,
          }));

          const seatsInBooking = (booking?.booking_items || []).reduce(
            (sum, bi) => sum + (bi.seats_count || 1),
            0
          );
          totalSeats += seatsInBooking;

          const isCheckedIn = !!item.is_used;
          if (isCheckedIn) {
            checkedInCount++;
          }

          attendees.push({
            id: item.id,
            ticket_code: item.ticket_code,
            customer_name: item.customer_name || booking?.customer_name || 'Guest',
            customer_email: booking?.customer_email || '',
            customer_phone: booking?.customer_phone || '',
            booking_id: booking?.id,
            event_id: booking?.event_id,
            event_title_en: booking?.events?.title_en,
            event_title_ar: booking?.events?.title_ar,
            tables,
            seats_count: seatsInBooking,
            total_amount: booking?.total_amount,
            currency: booking?.currency || 'CAD',
            is_used: isCheckedIn,
            used_at: item.used_at,
            created_at: item.created_at,
            isRegistration: false,
          });
        });
      }
    }

    // 2. Query Event Registrations (if source is 'all' or 'registrations', or event is conference/all)
    if (source !== 'tickets') {
      let regList = [];
      try {
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('get_event_registrations_attendees', {
          p_event_id: eventId || null,
        });
        if (!rpcErr && Array.isArray(rpcData)) {
          regList = rpcData;
        }
      } catch (e) {
        console.warn('RPC get_event_registrations_attendees exception:', e.message);
      }

      if (regList.length === 0) {
        let regQuery = supabaseAdmin
          .from('event_registrations')
          .select('*')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false });

        if (eventId) {
          if (eventId === 'press-conference') {
            regQuery = regQuery.or(`event_id.is.null,event_title.ilike.%press conference%`);
          } else {
            regQuery = regQuery.eq('event_id', eventId);
          }
        }

        const { data: regData, error: regErr } = await regQuery;
        if (!regErr && regData) {
          regList = regData;
        }
      }

      totalTickets += regList.length;
      totalSeats += regList.length;

      regList.forEach((reg) => {
          const isAttended = reg.status === 'attended';
          if (isAttended) {
            checkedInCount++;
          }

          attendees.push({
            id: reg.id,
            ticket_code: reg.registration_number,
            customer_name: reg.full_name,
            customer_email: reg.email || '',
            customer_phone: reg.phone_number || '',
            booking_id: reg.id,
            event_id: reg.event_id || 'press-conference',
            event_title_en: reg.event_title || 'The 4th Press Conference',
            event_title_ar: 'المؤتمر الصحفي الرابع',
            tables: [
              {
                table_name: reg.category || 'Guest Registration',
                table_code: reg.category,
                seats_count: 1,
              },
            ],
            seats_count: 1,
            total_amount: 0,
            currency: 'CAD',
            is_used: isAttended,
            used_at: isAttended ? reg.updated_at : null,
            created_at: reg.created_at,
            isRegistration: true,
            registration_number: reg.registration_number,
            category: reg.category,
            organization_name: reg.organization_name,
            job_title: reg.job_title,
          });
        });
    }

    // Sort combined attendees newest first
    attendees.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const remainingCount = Math.max(0, totalTickets - checkedInCount);
    const checkInPercentage = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

    return {
      stats: {
        totalTickets,
        totalSeats,
        checkedInCount,
        remainingCount,
        checkInPercentage,
      },
      attendees,
    };
  },

  /**
   * Manually toggle check-in state of a ticket or registration (for Gate managers)
   * @param {Object} params
   * @param {string} params.ticketId
   * @param {boolean} params.isUsed
   * @param {boolean} [params.isRegistration]
   * @param {string} [params.adminId]
   */
  async toggleTicketCheckIn({ ticketId, isUsed, isRegistration = false, adminId = null }) {
    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    const now = new Date().toISOString();

    if (isRegistration) {
      try {
        const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('toggle_registration_check_in', {
          p_registration_id: ticketId,
          p_is_used: isUsed,
        });
        if (!rpcErr && rpcData) {
          return rpcData;
        }
      } catch (rpcErr) {
        console.warn('RPC toggle_registration_check_in exception, falling back to JS logic:', rpcErr.message);
      }

      const newStatus = isUsed ? 'attended' : 'registered';
      const { data, error } = await supabaseAdmin
        .from('event_registrations')
        .update({
          status: newStatus,
          updated_at: now,
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling registration check-in:', error);
        throw error;
      }

      return {
        ...data,
        is_used: isUsed,
        used_at: isUsed ? now : null,
        isRegistration: true,
      };
    }

    const updateData = {
      is_used: isUsed,
      used_at: isUsed ? now : null,
      checked_in_by: isUsed ? adminId : null,
    };

    const { data, error } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select('*, bookings(*, events(*))')
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    // Fallback: Try event_registrations if not found in tickets
    try {
      const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('toggle_registration_check_in', {
        p_registration_id: ticketId,
        p_is_used: isUsed,
      });
      if (!rpcErr && rpcData) {
        return rpcData;
      }
    } catch {
      // Fallback to direct update if RPC is unavailable
    }

    const newStatus = isUsed ? 'attended' : 'registered';
    const { data: regData, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .update({
        status: newStatus,
        updated_at: now,
      })
      .eq('id', ticketId)
      .select()
      .maybeSingle();

    if (regError || !regData) {
      console.error('Error toggling check-in (ticket and registration not found):', error || regError);
      throw error || regError;
    }

    return {
      ...regData,
      is_used: isUsed,
      used_at: isUsed ? now : null,
      isRegistration: true,
    };
  }
};

module.exports = ticketService;
