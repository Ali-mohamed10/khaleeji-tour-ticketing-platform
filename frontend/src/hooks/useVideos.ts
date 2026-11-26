/**
 * useVideos Hooks
 *
 * React Query hooks for fetching, mutating, and managing promo videos.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videoService, EventVideo } from '../services/videoService';

export const EVENT_VIDEOS_KEY = (eventId?: string) => ['event-videos', eventId || 'all'];
export const PLACEMENT_VIDEOS_KEY = (placement?: string) => ['placement-videos', placement || 'all'];
export const ADMIN_VIDEOS_KEY = ['admin-videos'];

/**
 * Fetch active videos for an event
 */
export const useEventVideos = (eventId?: string) => {
  return useQuery<EventVideo[], Error>({
    queryKey: EVENT_VIDEOS_KEY(eventId),
    queryFn: () => (eventId ? videoService.getVideosByEventId(eventId) : Promise.resolve([])),
    enabled: !!eventId,
    staleTime: 60000,
  });
};

/**
 * Fetch active videos by placement
 */
export const usePlacementVideos = (placement: string) => {
  return useQuery<EventVideo[], Error>({
    queryKey: PLACEMENT_VIDEOS_KEY(placement),
    queryFn: () => videoService.getVideosByPlacement(placement),
    staleTime: 60000,
  });
};

/**
 * Fetch all videos for admin dashboard
 */
export const useAdminVideos = () => {
  return useQuery<EventVideo[], Error>({
    queryKey: ADMIN_VIDEOS_KEY,
    queryFn: () => videoService.getAllVideosForAdmin(),
  });
};

/**
 * Upload video file mutation
 */
export const useUploadVideo = () => {
  return useMutation({
    mutationFn: ({ file, eventId }: { file: File; eventId?: string | null }) =>
      videoService.uploadVideo(file, eventId),
  });
};

/**
 * Upload poster image file mutation
 */
export const useUploadPoster = () => {
  return useMutation({
    mutationFn: ({ file, eventId }: { file: File; eventId?: string | null }) =>
      videoService.uploadPosterImage(file, eventId),
  });
};

/**
 * Create video record mutation
 */
export const useCreateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Partial<EventVideo>) => videoService.createVideo(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VIDEOS_KEY });
      if (variables.event_id) {
        queryClient.invalidateQueries({ queryKey: EVENT_VIDEOS_KEY(variables.event_id) });
      }
      queryClient.invalidateQueries({ queryKey: ['placement-videos'] });
    },
  });
};

/**
 * Update video record mutation
 */
export const useUpdateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EventVideo> }) =>
      videoService.updateVideo(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VIDEOS_KEY });
      if (data.event_id) {
        queryClient.invalidateQueries({ queryKey: EVENT_VIDEOS_KEY(data.event_id) });
      }
      queryClient.invalidateQueries({ queryKey: ['placement-videos'] });
    },
  });
};

/**
 * Delete video mutation
 */
export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VIDEOS_KEY });
      queryClient.invalidateQueries({ queryKey: ['event-videos'] });
      queryClient.invalidateQueries({ queryKey: ['placement-videos'] });
    },
  });
};

/**
 * Toggle video status mutation
 */
export const useToggleVideoStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: boolean }) =>
      videoService.toggleVideoStatus(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_VIDEOS_KEY });
      queryClient.invalidateQueries({ queryKey: ['event-videos'] });
      queryClient.invalidateQueries({ queryKey: ['placement-videos'] });
    },
  });
};
