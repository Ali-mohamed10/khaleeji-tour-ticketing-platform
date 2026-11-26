/**
 * Booking Report Service
 *
 * Provides functions to fetch event seat capacity, booked seats, remaining seats,
 * and detailed booking records per event.
 */
import { supabase } from '../lib/supabaseClient';

export const bookingReportService = {
  /**
   * Fetch event bookings report including capacity, booked, remaining, and guest list
   */
  async getEventBookingsReport() {
    // 1. Fetch all events with their seat maps and tables
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, slug, title_en, title_ar, venue_en, venue_ar, start_date, end_date, cover_image_url, seat_map_id, seat_maps(id, name, tables(id, capacity, booked_seats, status))')
      .order('start_date', { ascending: false });

    if (eventsError) throw eventsError;

    // 2. Fetch all paid bookings with their tickets and booking items
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        event_id,
        customer_name,
        customer_email,
        customer_phone,
        status,
        total_amount,
        currency,
        created_at,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        tickets(id, ticket_code, is_used, used_at, qr_code_url),
        booking_items(id, seats_count, unit_price, subtotal, tables(id, table_code, svg_element_id))
      `)
      .eq('status', 'PAID')
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    const allBookings = bookings || [];

    // 3. Aggregate stats per event
    return (events || []).map((event) => {
      const tables = event.seat_maps?.tables || [];
      const totalCapacity = tables.reduce((acc, tbl) => acc + (Number(tbl.capacity) || 0), 0);

      // Filter bookings for this event
      const eventBookings = allBookings.filter((b) => b.event_id === event.id);

      // Compute booked seats from booking items
      const bookedSeats = eventBookings.reduce((sum, b) => {
        const itemSeats = (b.booking_items || []).reduce((iSum, item) => iSum + (Number(item.seats_count) || 0), 0);
        return sum + itemSeats;
      }, 0);

      const remainingSeats = Math.max(0, totalCapacity - bookedSeats);
      const totalRevenue = eventBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

      // Format clean booking items
      const formattedBookings = eventBookings.map((b) => {
        const ticket = Array.isArray(b.tickets) ? b.tickets[0] : b.tickets;
        const tablesSummary = (b.booking_items || []).map((item) => {
          const rawCode = (item.tables?.table_code || item.tables?.svg_element_id || '').toString().trim();
          const cleanCode = rawCode.replace(/^#+/, '');
          return {
            table_name: cleanCode ? `Table #${cleanCode}` : 'General Table',
            seats_count: item.seats_count || 1,
            unit_price: item.unit_price || 0,
          };
        });

        const totalSeatsBooked = tablesSummary.reduce((acc, t) => acc + t.seats_count, 0);

        // Resolve Payment Method (Stripe vs Cash / WhatsApp / Bank Transfer)
        const paymentIntent = (b.stripe_payment_intent_id || '').trim();
        const checkoutSession = (b.stripe_checkout_session_id || '').trim();
        let paymentMethod = 'Stripe';

        if (paymentIntent.startsWith('OFFLINE_')) {
          const parts = paymentIntent.replace(/^OFFLINE_/, '').split('_');
          const raw = (parts[0] || 'CASH').toUpperCase();
          if (raw === 'CASH') paymentMethod = 'Cash';
          else if (raw === 'WHATSAPP') paymentMethod = 'WhatsApp';
          else if (raw.includes('BANK')) paymentMethod = 'Bank Transfer';
          else paymentMethod = raw;
        } else if (checkoutSession.startsWith('MANUAL_OFFLINE_')) {
          paymentMethod = 'Cash';
        } else {
          paymentMethod = 'Stripe';
        }

        return {
          id: b.id,
          customer_name: b.customer_name || 'Guest',
          customer_email: b.customer_email,
          customer_phone: b.customer_phone,
          status: b.status,
          total_amount: b.total_amount,
          currency: b.currency || 'CAD',
          created_at: b.created_at,
          payment_method: paymentMethod,
          ticket_code: ticket?.ticket_code || '—',
          is_used: !!ticket?.is_used,
          used_at: ticket?.used_at,
          total_seats: totalSeatsBooked,
          tables_summary: tablesSummary,
        };
      });

      return {
        event_id: event.id,
        slug: event.slug,
        title_en: event.title_en,
        title_ar: event.title_ar,
        venue_en: event.venue_en,
        venue_ar: event.venue_ar,
        start_date: event.start_date,
        end_date: event.end_date,
        cover_image_url: event.cover_image_url,
        total_capacity: totalCapacity, // Capacity in numbers only
        booked_seats: bookedSeats,     // Booked in numbers only
        remaining_seats: remainingSeats, // Remaining in numbers only
        bookings_count: eventBookings.length,
        total_revenue: totalRevenue,
        bookings: formattedBookings,
      };
    });
  },

  /**
   * Cancel and release a booking, returning seats to available status
   */
  async cancelBooking(bookingId) {
    if (!bookingId) throw new Error('bookingId is required');
    const { data, error } = await supabase.rpc('admin_cancel_booking', {
      p_booking_id: bookingId,
    });
    if (error) throw error;
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to cancel booking');
    }
    return data;
  },
};

export default bookingReportService;
