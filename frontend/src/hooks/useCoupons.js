/**
 * useCoupons Hook
 *
 * Provides TanStack Query hooks for querying and mutating discount coupons.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '../services/couponService';

export const COUPONS_QUERY_KEY = ['admin', 'coupons'];

/**
 * Fetch all coupons for the admin dashboard
 */
export const useCoupons = () => {
  return useQuery({
    queryKey: COUPONS_QUERY_KEY,
    queryFn: () => couponService.getCoupons(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to create a new coupon
 */
export const useCreateCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newCouponData) => couponService.createCoupon(newCouponData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
  });
};

/**
 * Hook to toggle coupon active status
 */
export const useToggleCouponStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) => couponService.toggleCouponStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // Cancel ongoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: COUPONS_QUERY_KEY });

      const previousCoupons = queryClient.getQueryData(COUPONS_QUERY_KEY);

      // Optimistically update the UI
      if (previousCoupons) {
        queryClient.setQueryData(COUPONS_QUERY_KEY, (old = []) =>
          old.map((c) => (c.id === id ? { ...c, is_active: isActive } : c))
        );
      }

      return { previousCoupons };
    },
    onError: (err, variables, context) => {
      if (context?.previousCoupons) {
        queryClient.setQueryData(COUPONS_QUERY_KEY, context.previousCoupons);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
  });
};

/**
 * Hook to delete a coupon
 */
export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
  });
};
