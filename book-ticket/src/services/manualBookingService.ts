import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const envApiUrl = (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined && envApiUrl !== '' ? envApiUrl : '';

export interface CreateManualBookingPayload {
  eventId: string;
  customerEmail: string;
  tableId?: string;
  tableCode?: string;
  seatsCount: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  customAmount?: number | null;
}

export interface ManualBookingResponse {
  success: boolean;
  bookingId: string;
  ticketCode: string;
  ticket?: any;
  bookingResult?: any;
  emailDelivered: boolean;
  message?: string;
  error?: string;
}

export const manualBookingService = {
  /**
   * Submit manual offline booking (Cash & WhatsApp) to Serverless backend
   */
  async createManualBooking(payload: CreateManualBookingPayload): Promise<ManualBookingResponse> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post<ManualBookingResponse>(
      `${API_BASE_URL}/api/manual-booking`,
      payload,
      { headers }
    );

    return response.data;
  },
};
