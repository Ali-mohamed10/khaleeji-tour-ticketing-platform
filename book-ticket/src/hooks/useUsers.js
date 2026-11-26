/**
 * useUsers Hook
 *
 * Provides React Query hooks for user management and dashboard analytics.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';

export const USERS_QUERY_KEY = ['users'];
export const DASHBOARD_STATS_KEY = ['dashboard-stats'];

export const useUsers = () => {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => userService.getUsers(),
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: () => userService.getDashboardStats(),
    refetchInterval: 30000, // refresh stats every 30s
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }) => userService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }) => userService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
};
