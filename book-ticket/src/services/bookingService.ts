import axios from 'axios';
import { CheckoutParams, CheckoutResponse, Booking } from '../types/booking';

// Prefer VITE_API_BASE_URL when set; otherwise use relative /api so Vite proxy and production work seamlessly
const envApiUrl = (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined && envApiUrl !== '' ? envApiUrl : '';

export const bookingService = {
  /**
   * Initiate Stripe Checkout session & Table reservation
   */
  async createCheckout(params: CheckoutParams): Promise<CheckoutResponse> {
    const response = await axios.post<CheckoutResponse>(
      `${API_BASE_URL}/api/checkout`,
      {
        ...params,
        originUrl: window.location.origin,
      }
    );
    return response.data;
  },

  /**
   * Fetch booking status and ticket by ID or Session ID
   */
  async getBooking(query: { id?: string; sessionId?: string }): Promise<Booking> {
    const params = new URLSearchParams();
    if (query.id) params.append('id', query.id);
    if (query.sessionId) params.append('session_id', query.sessionId);

    const response = await axios.get<{ success: boolean; booking: Booking }>(
      `${API_BASE_URL}/api/booking?${params.toString()}`
    );

    return response.data.booking;
  },
};
