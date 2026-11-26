/**
 * useManualBooking Hook
 *
 * Provides TanStack React Query mutation for creating manual offline bookings
 * and automatically refreshing related dashboard metrics, bookings reports,
 * and table availability caches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manualBookingService, CreateManualBookingPayload, ManualBookingResponse } from '../services/manualBookingService';
import { EVENT_BOOKINGS_REPORT_KEY } from './useEventBookingsReport';

export const useCreateManualBooking = () => {
  const queryClient = useQueryClient();

  return useMutation<ManualBookingResponse, Error, CreateManualBookingPayload>({
    mutationFn: (payload: CreateManualBookingPayload) => manualBookingService.createManualBooking(payload),
    onSuccess: () => {
      // Refresh all dependent queries across the Admin Dashboard
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['seatMap'] });
      queryClient.invalidateQueries({ queryKey: EVENT_BOOKINGS_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};
