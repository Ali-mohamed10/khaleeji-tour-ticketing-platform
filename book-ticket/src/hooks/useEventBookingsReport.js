/**
 * useEventBookingsReport Hook
 *
 * Provides React Query hook for fetching per-event occupancy and bookings statistics.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingReportService } from '../services/bookingReportService';

export const EVENT_BOOKINGS_REPORT_KEY = ['event-bookings-report'];

export const useEventBookingsReport = () => {
  return useQuery({
    queryKey: EVENT_BOOKINGS_REPORT_KEY,
    queryFn: () => bookingReportService.getEventBookingsReport(),
    refetchInterval: 15000, // auto-refresh every 15s
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId) => bookingReportService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_BOOKINGS_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
      queryClient.invalidateQueries({ queryKey: ['seatMap'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

