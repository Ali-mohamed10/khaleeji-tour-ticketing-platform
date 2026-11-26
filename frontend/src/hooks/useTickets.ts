import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, EventAttendeesResponse } from '../services/ticketService';

export const useEventAttendees = (eventId?: string) => {
  return useQuery<EventAttendeesResponse>({
    queryKey: ['event-attendees', eventId || 'all'],
    queryFn: () => ticketService.getEventAttendees(eventId),
    refetchInterval: 10000, // Background poll every 10s for live venue updates
  });
};

export const useToggleCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      isUsed,
      isRegistration,
    }: {
      ticketId: string;
      isUsed: boolean;
      isRegistration?: boolean;
    }) => ticketService.toggleAttendeeCheckIn(ticketId, isUsed, isRegistration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });
    },
  });
};
