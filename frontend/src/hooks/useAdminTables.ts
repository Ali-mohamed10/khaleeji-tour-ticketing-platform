/**
 * useAdminTables Hooks
 *
 * Provides React Query hooks for fetching and modifying table block/unblock statuses.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTableService, AdminTable } from '../services/adminTableService';
import { EVENT_BOOKINGS_REPORT_KEY } from './useEventBookingsReport';

export const ADMIN_TABLES_KEY = (seatMapId?: string) => ['admin-tables', seatMapId || 'all'];

/**
 * Fetch tables for a given seat map
 */
export const useAdminTables = (seatMapId?: string) => {
  return useQuery<AdminTable[], Error>({
    queryKey: ADMIN_TABLES_KEY(seatMapId),
    queryFn: () => (seatMapId ? adminTableService.getTablesBySeatMapId(seatMapId) : Promise.resolve([])),
    enabled: !!seatMapId,
    staleTime: 5000,
  });
};

/**
 * Mutate a single table block/unblock status
 */
export const useSetTableBlockStatus = (seatMapId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { tableId: string; isBlocked: boolean; customSeats?: number | null }) =>
      adminTableService.setTableBlockStatus(params),
    onSuccess: () => {
      // Invalidate relevant query caches for immediate UI update
      if (seatMapId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_TABLES_KEY(seatMapId) });
        queryClient.invalidateQueries({ queryKey: ['seatMap', seatMapId] });
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: EVENT_BOOKINGS_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

/**
 * Bulk mutate block/unblock status for multiple tables
 */
export const useBulkSetBlockStatus = (seatMapId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { tableIds: string[]; isBlocked: boolean }) =>
      adminTableService.bulkSetBlockStatus(params),
    onSuccess: () => {
      if (seatMapId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_TABLES_KEY(seatMapId) });
        queryClient.invalidateQueries({ queryKey: ['seatMap', seatMapId] });
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: EVENT_BOOKINGS_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

/**
 * Reset all manual blocks for an event seat map and restore true actual bookings
 */
export const useResetEventBlocks = (seatMapId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seatMapIdToReset: string) => adminTableService.resetEventBlocks(seatMapIdToReset),
    onSuccess: () => {
      if (seatMapId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_TABLES_KEY(seatMapId) });
        queryClient.invalidateQueries({ queryKey: ['seatMap', seatMapId] });
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: EVENT_BOOKINGS_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};
