/**
 * useRealtimeTables Hook
 *
 * Purpose: Subscribe to real-time changes on the Supabase `public.tables` table.
 *          When any table's status, booked_seats, or hold changes in Postgres,
 *          it automatically invalidates TanStack Query cache so the seat map
 *          and event details re-render with fresh real-time data immediately.
 *
 * Input:
 *   - seatMapId: UUID of the seat map to filter changes (optional)
 *   - eventSlug: Slug of the current event to invalidate query cache (optional)
 *   - eventId: ID of the current event (optional)
 *
 * Output: void
 * Dependencies: @tanstack/react-query, @supabase/supabase-js, react
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const useRealtimeTables = (
  seatMapId?: string,
  eventSlug?: string,
  eventId?: string
): void => {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!seatMapId) return;

    // Unique channel identifier per seat map
    const channelName = `realtime-seatmap-${seatMapId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `seat_map_id=eq.${seatMapId}`,
        },
        () => {
          // Debounce cache invalidation to prevent multiple rapid network requests
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            if (eventSlug) {
              queryClient.invalidateQueries({ queryKey: ['event', 'slug', eventSlug] });
            }
            if (eventId) {
              queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            }
            queryClient.invalidateQueries({ queryKey: ['seatMap', seatMapId] });
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [seatMapId, eventSlug, eventId, queryClient]);
};
