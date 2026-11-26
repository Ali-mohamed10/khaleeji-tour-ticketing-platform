import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../services/eventService';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
  });
};

/** Lean published/soon list for the public homepage. */
export const usePublicEvents = () => {
  return useQuery({
    queryKey: ['events', 'public'],
    queryFn: () => eventService.getPublicEvents(),
  });
};

export const useEvent = (id) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id),
    enabled: !!id,
  });
};

export const useEventBySlug = (slug) => {
  return useQuery({
    queryKey: ['event', 'slug', slug],
    queryFn: () => eventService.getEventBySlug(slug),
    enabled: !!slug,
  });
};

const invalidateEventLists = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['events'] });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: () => {
      invalidateEventLists(queryClient);
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => eventService.updateEvent(id, data),
    onSuccess: (data) => {
      invalidateEventLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => eventService.deleteEvent(id),
    onSuccess: () => {
      invalidateEventLists(queryClient);
    },
  });
};

export const useDuplicateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => eventService.duplicateEvent(id),
    onSuccess: () => {
      invalidateEventLists(queryClient);
    },
  });
};

export const useUploadEventCover = () => {
  return useMutation({
    mutationFn: (file) => eventService.uploadCoverImage(file),
  });
};
