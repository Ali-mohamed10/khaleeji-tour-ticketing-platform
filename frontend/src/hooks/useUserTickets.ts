import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export interface UserTicketTable {
  table_id: string;
  table_name: string;
  table_code?: string;
  seats_count: number;
  unit_price: number;
}

export interface UserTicket {
  id: string;
  ticket_code: string;
  customer_name: string;
  qr_code_url?: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  booking_id: string;
  booking_status: string;
  total_amount: number;
  currency: string;
  event: {
    id: string;
    slug: string;
    title_en: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    venue_en?: string;
    venue_ar?: string;
    city_en?: string;
    city_ar?: string;
    start_date: string;
    end_date?: string;
    cover_image_url?: string;
  };
  tables: UserTicketTable[];
  totalSeats: number;
  isUpcoming: boolean;
}

/**
 * useUserTickets Hook
 *
 * Fetches all confirmed tickets belonging to the currently authenticated user
 * along with associated event details, seat allocations, and QR codes.
 */
export const useUserTickets = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<UserTicket[]>({
    queryKey: ['user-tickets', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_code,
          customer_name,
          qr_code_url,
          is_used,
          used_at,
          created_at,
          bookings!inner (
            id,
            user_id,
            status,
            total_amount,
            currency,
            customer_name,
            customer_email,
            customer_phone,
            created_at,
            events (
              id,
              slug,
              title_en,
              title_ar,
              description_en,
              description_ar,
              venue_en,
              venue_ar,
              city_en,
              city_ar,
              start_date,
              end_date,
              cover_image_url
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
        .eq('bookings.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tickets:', error);
        throw error;
      }

      const list = data || [];
      const now = new Date();

      return list.map((item: any) => {
        const booking = item.bookings;
        const event = booking?.events;
        const bookingItems = booking?.booking_items || [];

        const tables: UserTicketTable[] = bookingItems.map((bi: any) => {
          const tbl = bi.tables;
          const rawCode = (tbl?.table_code || tbl?.svg_element_id || '').toString().trim();
          const cleanCode = rawCode.replace(/^#+/, '');
          const tableLabel = cleanCode ? `Table #${cleanCode}` : 'General Table';
          return {
            table_id: tbl?.id,
            table_name: tableLabel,
            table_code: cleanCode || rawCode,
            seats_count: bi.seats_count || 1,
            unit_price: bi.unit_price || 0,
          };
        });

        const totalSeats = tables.reduce((acc, t) => acc + t.seats_count, 0);
        const eventDate = event?.start_date ? new Date(event.start_date) : new Date(item.created_at);
        const isUpcoming = eventDate >= now;

        return {
          id: item.id,
          ticket_code: item.ticket_code,
          customer_name: item.customer_name || booking?.customer_name || 'Guest',
          qr_code_url: item.qr_code_url,
          is_used: !!item.is_used,
          used_at: item.used_at,
          created_at: item.created_at,
          booking_id: booking?.id,
          booking_status: booking?.status || 'PAID',
          total_amount: booking?.total_amount || 0,
          currency: booking?.currency || 'CAD',
          event: {
            id: event?.id,
            slug: event?.slug || '',
            title_en: event?.title_en || 'Event Ticket',
            title_ar: event?.title_ar,
            description_en: event?.description_en,
            description_ar: event?.description_ar,
            venue_en: event?.venue_en,
            venue_ar: event?.venue_ar,
            city_en: event?.city_en,
            city_ar: event?.city_ar,
            start_date: event?.start_date || item.created_at,
            end_date: event?.end_date,
            cover_image_url: event?.cover_image_url,
          },
          tables,
          totalSeats,
          isUpcoming,
        };
      });
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
