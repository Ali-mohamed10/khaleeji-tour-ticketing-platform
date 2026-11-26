/**
 * Booking Service (Backend)
 *
 * Provides server-side booking business logic using atomic Supabase RPCs.
 */
const { supabaseAdmin } = require('./supabaseAdmin');
const ticketService = require('./ticket.service');

const bookingService = {
  /**
   * Reserve tables and create pending booking using atomic RPC with row-level locking
   */
  async createReservation({
    eventId,
    userId = null,
    customerName,
    customerEmail,
    customerPhone,
    tableSelections,
    reservationMinutes = 15,
  }) {
    console.log('[createReservation] Input tableSelections:', JSON.stringify(tableSelections));

    // Sanitize and ensure all table_id in tableSelections are valid UUIDs
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let sanitizedTableSelections = Array.isArray(tableSelections) ? tableSelections : [];

    const hasNonUuid = sanitizedTableSelections.some(
      (t) => !t.table_id || !UUID_REGEX.test(String(t.table_id))
    );

    console.log('[createReservation] hasNonUuid:', hasNonUuid);

    if (hasNonUuid && eventId) {
      try {
        const { data: eventData } = await supabaseAdmin
          .from('events')
          .select('seat_map_id')
          .eq('id', eventId)
          .maybeSingle();

        console.log('[createReservation] eventData:', JSON.stringify(eventData));

        if (eventData?.seat_map_id) {
          const { data: dbTables } = await supabaseAdmin
            .from('tables')
            .select('id, table_code')
            .eq('seat_map_id', eventData.seat_map_id);

          console.log('[createReservation] dbTables found:', dbTables?.length, 'for seat_map_id:', eventData.seat_map_id);

          if (dbTables && dbTables.length > 0) {
            sanitizedTableSelections = sanitizedTableSelections.map((item) => {
              const rawId = item.table_id || item.id || item.table_code;
              if (rawId && UUID_REGEX.test(String(rawId))) {
                return {
                  table_id: rawId,
                  seats_count: Number(item.seats_count || item.selectedSeatsCount || 1),
                };
              }

              const cleanCode = String(rawId || '').replace(/^#+/, '').trim().toUpperCase();
              const matched = dbTables.find(
                (dt) =>
                  dt.id === rawId ||
                  String(dt.table_code || '').replace(/^#+/, '').trim().toUpperCase() === cleanCode
              );

              console.log('[createReservation] Resolving rawId:', rawId, '-> matched:', matched?.id);

              return {
                table_id: matched ? matched.id : rawId,
                seats_count: Number(item.seats_count || item.selectedSeatsCount || 1),
              };
            });
          }
        }
      } catch (lookupErr) {
        console.warn('[createReservation] Non-blocking table ID lookup warning:', lookupErr);
      }
    }

    console.log('[createReservation] Final sanitizedTableSelections:', JSON.stringify(sanitizedTableSelections));

    const { data, error } = await supabaseAdmin.rpc('reserve_tables_for_booking', {
      p_event_id: eventId,
      p_user_id: userId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_customer_phone: customerPhone,
      p_table_selections: sanitizedTableSelections,
      p_reservation_minutes: reservationMinutes,
    });

    if (error) {
      console.error('[createReservation] RPC error:', JSON.stringify(error));
      throw new Error(error.message || 'Failed to reserve table. Table may already be reserved.');
    }

    console.log('[createReservation] RPC success result:', JSON.stringify(data));
    return data;
  },

  /**
   * Save Stripe checkout session ID on booking record
   */
  async updateStripeSessionId(bookingId, checkoutSessionId) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ stripe_checkout_session_id: checkoutSessionId })
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating stripe session ID:', error);
    }
    return data;
  },

  /**
   * Confirm booking payment from Stripe Webhook in ONE atomic transaction
   */
  async confirmPayment({ bookingId, paymentIntentId, eventId, amount, currency }) {
    console.log(`[confirmPayment] Starting confirmation for booking: ${bookingId}`);
    const { data, error } = await supabaseAdmin.rpc('confirm_booking_payment', {
      p_booking_id: bookingId,
      p_stripe_payment_intent_id: paymentIntentId,
      p_stripe_event_id: eventId,
      p_amount: amount,
      p_currency: currency,
    });

    if (error) {
      console.error('Error in confirm_booking_payment RPC:', error);
      throw error;
    }

    // Issue Ticket & QR code upon confirmation
    let ticket = null;
    try {
      ticket = await ticketService.issueTicketForBooking({
        bookingId,
        customerName: data?.customer_name,
      });
      console.log(`[confirmPayment] Ticket generated successfully: ${ticket?.ticket_code}`);

      // Dispatch emails (customer confirmation + admin notification)
      const emailService = require('./email.service');
      const emailPromises = [
        emailService.sendBookingConfirmationEmail({
          booking: data,
          ticket,
          bookingId,
        }).catch((emailErr) => {
          console.error('[confirmPayment] Customer confirmation email error:', emailErr);
          return { success: false, error: emailErr.message };
        }),
      ];

      // Dispatch admin notification on initial confirmation (avoid duplicate notifications if booking was already paid)
      if (data?.message !== 'Booking already paid') {
        emailPromises.push(
          emailService.sendAdminBookingNotification({
            booking: data,
            ticket,
            bookingId,
            paymentMethod: 'Stripe',
          }).catch((adminEmailErr) => {
            console.error('[confirmPayment] Admin booking notification error:', adminEmailErr);
            return { success: false, error: adminEmailErr.message };
          })
        );
      }

      // CRITICAL FOR VERCEL SERVERLESS: Wait for email dispatches before function finishes execution
      const emailResults = await Promise.allSettled(emailPromises);
      emailResults.forEach((res, idx) => {
        const type = idx === 0 ? 'Customer' : 'Admin';
        if (res.status === 'fulfilled') {
          console.log(`[confirmPayment] ${type} email dispatch result:`, res.value);
        } else {
          console.error(`[confirmPayment] ${type} email dispatch rejected:`, res.reason);
        }
      });
    } catch (ticketErr) {
      console.error('[confirmPayment] Warning: Ticket generation/email failed:', ticketErr);
    }

    // Increment coupon usage if applied
    try {
      let appliedCouponId = data?.coupon_id;
      if (!appliedCouponId) {
        const { data: bRow } = await supabaseAdmin
          .from('bookings')
          .select('coupon_id')
          .eq('id', bookingId)
          .maybeSingle();
        appliedCouponId = bRow?.coupon_id;
      }

      if (appliedCouponId) {
        await bookingService.incrementCouponUsage(appliedCouponId);
        console.log(`[confirmPayment] Incremented usage for coupon: ${appliedCouponId}`);
      }
    } catch (couponErr) {
      console.error('[confirmPayment] Warning: Failed to increment coupon usage:', couponErr);
    }

    return { bookingResult: data, ticket };
  },

  /**
   * Mark booking as failed and release tables
   */
  async failPayment(bookingId) {
    const { data, error } = await supabaseAdmin.rpc('fail_booking_payment', {
      p_booking_id: bookingId,
    });

    if (error) console.error('Error failing booking payment:', error);
    return data;
  },

  /**
   * Run automatic expiration cleanup for stale reservations
   */
  async expireStaleReservations() {
    try {
      const { data, error } = await supabaseAdmin.rpc('expire_stale_reservations');
      if (error) console.error('Error expiring stale reservations:', error);
      return data;
    } catch (err) {
      console.error('expireStaleReservations exception:', err);
      return 0;
    }
  },

  /**
   * Get booking details by booking ID with items, event, tables and tickets
   */
  async getBookingById(bookingId) {
    if (!bookingId) return null;
    await this.expireStaleReservations();

    try {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, tables(*)), tickets(*), events(*)')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching booking with relations by ID, trying simple select:', error);
        const { data: simpleBooking } = await supabaseAdmin
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .maybeSingle();
        return simpleBooking;
      }
      return booking;
    } catch (err) {
      console.error('getBookingById exception:', err);
      return null;
    }
  },

  /**
   * Get booking details by Stripe Checkout Session ID
   */
  async getBookingBySessionId(sessionId) {
    if (!sessionId) return null;
    await this.expireStaleReservations();

    try {
      const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, tables(*)), tickets(*), events(*)')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching booking with relations by session ID, trying simple select:', error);
        const { data: simpleBooking } = await supabaseAdmin
          .from('bookings')
          .select('*')
          .eq('stripe_checkout_session_id', sessionId)
          .maybeSingle();
        return simpleBooking;
      }
      return booking;
    } catch (err) {
      console.error('getBookingBySessionId exception:', err);
      return null;
    }
  },

  /**
   * Validate coupon server-side directly against database
   */
  async validateCouponServer({ code, eventId }) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();

    try {
      const { data: coupon, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (error || !coupon) return null;
      if (!coupon.is_active) return null;
      if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) return null;
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return null;

      if (eventId) {
        const hasEventIds = Array.isArray(coupon.event_ids) && coupon.event_ids.length > 0;
        if (hasEventIds && !coupon.event_ids.includes(eventId)) return null;
        if (!hasEventIds && coupon.event_id && coupon.event_id !== eventId) return null;
      }

      return coupon;
    } catch (err) {
      console.error('validateCouponServer error:', err);
      return null;
    }
  },

  /**
   * Apply coupon discount to a pending booking record
   */
  async applyCouponToBooking({ bookingId, couponId, discountAmount, originalAmount, newTotal }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({
          coupon_id: couponId,
          discount_amount: discountAmount,
          original_amount: originalAmount,
          total_amount: newTotal,
        })
        .eq('id', bookingId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error attaching coupon to booking:', error);
      }
      return data;
    } catch (err) {
      console.error('applyCouponToBooking error:', err);
      return null;
    }
  },

  /**
   * Increment coupon usage count atomically
   */
  async incrementCouponUsage(couponId) {
    if (!couponId) return;
    try {
      await supabaseAdmin.rpc('increment_coupon_usage', { p_coupon_id: couponId });
    } catch {
      // Fallback direct increment if RPC is not yet executed
      try {
        const { data: coupon } = await supabaseAdmin
          .from('coupons')
          .select('used_count')
          .eq('id', couponId)
          .maybeSingle();

        if (coupon) {
          await supabaseAdmin
            .from('coupons')
            .update({ used_count: (coupon.used_count || 0) + 1 })
            .eq('id', couponId);
        }
      } catch (fallbackErr) {
        console.error('Fallback coupon increment error:', fallbackErr);
      }
    }
  },

  /**
   * Create Manual Offline Booking (Cash / WhatsApp)
   * Atomically locks table, creates PAID booking record, generates ticket & QR code,
   * and delivers the official confirmation email via Resend template.
   */
  async createManualOfflineBooking({
    eventId,
    tableId,
    tableCode,
    seatsCount,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod = 'Cash / WhatsApp',
    customAmount = null,
    adminUserId = null,
  }) {
    if (!eventId) throw new Error('eventId is required');
    if (!customerEmail) throw new Error('customerEmail is required');
    if (!seatsCount || Number(seatsCount) <= 0) throw new Error('seatsCount must be greater than 0');

    // Resolve tableId if not provided directly as UUID
    let resolvedTableId = tableId;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!resolvedTableId || !UUID_REGEX.test(String(resolvedTableId))) {
      const codeLookup = String(tableCode || tableId || '').replace(/^#+/, '').trim().toUpperCase();
      if (!codeLookup) {
        throw new Error('Valid tableId or tableCode is required');
      }

      // Fetch event's seat_map_id
      const { data: eventData, error: eventErr } = await supabaseAdmin
        .from('events')
        .select('seat_map_id')
        .eq('id', eventId)
        .maybeSingle();

      if (eventErr || !eventData?.seat_map_id) {
        throw new Error('Event not found or has no seat map configured');
      }

      // Lookup table in that seat map
      const { data: dbTables, error: tErr } = await supabaseAdmin
        .from('tables')
        .select('id, table_code, svg_element_id')
        .eq('seat_map_id', eventData.seat_map_id);

      if (tErr || !dbTables || dbTables.length === 0) {
        throw new Error('No tables found for this event seat map');
      }

      const matched = dbTables.find((t) => {
        const cleanTCode = String(t.table_code || '').replace(/^#+/, '').trim().toUpperCase();
        const cleanSvg = String(t.svg_element_id || '').replace(/^#+/, '').trim().toUpperCase();
        return cleanTCode === codeLookup || cleanSvg === codeLookup || t.id === tableId;
      });

      if (!matched) {
        throw new Error(`Table "${tableCode || tableId}" not found in this event seat map`);
      }

      resolvedTableId = matched.id;
    }

    // Call atomic RPC to reserve seats and create paid booking
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('create_manual_offline_booking', {
      p_event_id: eventId,
      p_table_id: resolvedTableId,
      p_seats_count: Number(seatsCount),
      p_customer_name: customerName || null,
      p_customer_email: String(customerEmail).trim().toLowerCase(),
      p_customer_phone: customerPhone || null,
      p_payment_method: paymentMethod || 'Cash / WhatsApp',
      p_custom_amount: customAmount !== null && customAmount !== undefined && !isNaN(Number(customAmount)) ? Number(customAmount) : null,
      p_admin_user_id: adminUserId || null,
    });

    if (rpcError) {
      console.error('[createManualOfflineBooking] RPC Error:', rpcError);
      throw new Error(rpcError.message || 'Failed to create manual booking');
    }

    const bookingId = rpcResult?.booking_id;
    if (!bookingId) {
      throw new Error('No booking ID returned from database');
    }

    // Retrieve or issue Ticket
    let ticketCode = rpcResult?.ticket_code;
    let ticket = null;

    try {
      const { data: tRow } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (tRow) {
        ticket = tRow;
        ticketCode = tRow.ticket_code;
      } else {
        ticket = await ticketService.issueTicketForBooking({
          bookingId,
          customerName: customerName || 'Valued Guest',
        });
        ticketCode = ticket?.ticket_code;
      }
      console.log(`[createManualOfflineBooking] Ticket ready: ${ticketCode}`);
    } catch (ticketErr) {
      console.error('[createManualOfflineBooking] Warning: Ticket issue warning:', ticketErr.message);
    }

    // Dispatch Confirmation Email & Admin Notification via Resend templates
    let emailResult = null;
    let adminEmailResult = null;
    try {
      const emailService = require('./email.service');
      const emailPromises = [
        emailService.sendBookingConfirmationEmail({
          bookingId,
          ticket,
          force: true,
        }).catch((emailErr) => {
          console.error('[createManualOfflineBooking] Warning: Customer email dispatch failed:', emailErr);
          return { success: false, error: emailErr.message };
        }),
        emailService.sendAdminBookingNotification({
          bookingId,
          ticket,
          paymentMethod: paymentMethod || 'Cash',
        }).catch((adminEmailErr) => {
          console.error('[createManualOfflineBooking] Warning: Admin notification email dispatch failed:', adminEmailErr);
          return { success: false, error: adminEmailErr.message };
        }),
      ];

      const settled = await Promise.allSettled(emailPromises);
      emailResult = settled[0].status === 'fulfilled' ? settled[0].value : null;
      adminEmailResult = settled[1].status === 'fulfilled' ? settled[1].value : null;
      console.log('[createManualOfflineBooking] Customer email result:', emailResult);
      console.log('[createManualOfflineBooking] Admin email result:', adminEmailResult);
    } catch (emailErr) {
      console.error('[createManualOfflineBooking] Warning: Email dispatch failed:', emailErr);
    }

    return {
      success: true,
      bookingId,
      ticketCode: ticket?.ticket_code || null,
      ticket,
      bookingResult: rpcResult,
      emailDelivered: emailResult?.success ?? false,
      adminEmailDelivered: adminEmailResult?.success ?? false,
    };
  }
};

module.exports = bookingService;
