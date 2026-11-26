import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

// Prefer VITE_API_BASE_URL when set; otherwise use relative /api so Vite proxy
// (or Vercel) can forward requests. Do NOT default to localhost:3001 — the local
// Express server does not mount ticket scanner routes, which caused all-zero KPIs.
const envApiUrl = (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined && envApiUrl !== '' ? envApiUrl : '';

export interface VerifyTicketResponse {
  success: boolean;
  status: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'NOT_PAID' | 'ERROR';
  message: string;
  checked_in_now?: boolean;
  used_at?: string;
  isRegistration?: boolean;
  registration?: {
    id: string;
    registration_number: string;
    full_name: string;
    email: string;
    phone_number: string;
    category: string;
    event_title: string;
    organization_name?: string;
    job_title?: string;
    status: string;
  };
  ticket?: {
    id: string;
    ticket_code: string;
    customer_name: string;
    created_at: string;
    is_used: boolean;
    used_at?: string;
  };
  booking?: {
    id: string;
    total_amount: number;
    currency: string;
    customer_email?: string;
    customer_phone?: string;
  };
  event?: {
    id: string;
    title_en: string;
    title_ar?: string;
    venue_en: string;
    venue_ar?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    hero_image?: string;
  };
  tables?: Array<{
    table_name: string;
    table_number?: number | string;
    seats_count: number;
    price?: number;
  }>;
  error?: string;
}

export interface EventGateStats {
  totalTickets: number;
  totalSeats: number;
  checkedInCount: number;
  remainingCount: number;
  checkInPercentage: number;
}

export interface EventAttendee {
  id: string;
  ticket_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_id: string;
  event_id: string;
  event_title_en?: string;
  event_title_ar?: string;
  tables: Array<{
    table_name: string;
    table_code?: string;
    seats_count: number;
  }>;
  seats_count: number;
  total_amount: number;
  currency: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  isRegistration?: boolean;
  registration_number?: string;
  category?: string;
  organization_name?: string;
  job_title?: string;
}

export interface EventAttendeesResponse {
  success: boolean;
  stats: EventGateStats;
  attendees: EventAttendee[];
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const ticketService = {
  /**
   * Verify and Check-in a ticket code or registration
   */
  async verifyTicket(code: string, checkIn: boolean = true): Promise<VerifyTicketResponse> {
    const headers = await getAuthHeaders();
    const response = await axios.post<VerifyTicketResponse>(
      `${API_BASE_URL}/api/tickets/verify`,
      {
        code,
        checkIn,
      },
      { headers }
    );
    return response.data;
  },

  /**
   * Fetch all attendees and live gate check-in stats for an event
   */
  async getEventAttendees(eventId?: string, source?: string): Promise<EventAttendeesResponse> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (eventId) {
      params.append('event_id', eventId);
    }
    if (source) {
      params.append('source', source);
    }
    const response = await axios.get<EventAttendeesResponse>(
      `${API_BASE_URL}/api/tickets/event-attendees?${params.toString()}`,
      { headers }
    );
    return response.data;
  },

  /**
   * Manually toggle check-in status of an attendee
   */
  async toggleAttendeeCheckIn(
    ticketId: string,
    isUsed: boolean,
    isRegistration?: boolean
  ): Promise<{ success: boolean; ticket: any }> {
    const headers = await getAuthHeaders();
    const response = await axios.post<{ success: boolean; ticket: any }>(
      `${API_BASE_URL}/api/tickets/event-attendees`,
      {
        ticketId,
        isUsed,
        isRegistration: !!isRegistration,
      },
      { headers }
    );
    return response.data;
  },
};
