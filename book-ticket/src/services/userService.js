/**
 * User Service (Frontend)
 *
 * Provides functions to fetch users, update roles/statuses, and compute dashboard statistics.
 */
import { supabase } from '../lib/supabaseClient';

export const userService = {
  /**
   * Fetch all registered users / profiles
   */
  async getUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Update a user's role (admin, editor, gate_staff, customer)
   */
  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a user's status (active, suspended)
   */
  async updateUserStatus(userId, newStatus) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch aggregate dashboard statistics
   */
  async getDashboardStats() {
    const [eventsRes, bookingsRes, usersRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id, total_amount, currency, status'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const eventsCount = eventsRes.count || 0;
    const usersCount = usersRes.count || 0;

    const bookings = bookingsRes.data || [];
    const paidBookings = bookings.filter((b) => b.status === 'PAID');
    const bookingsCount = paidBookings.length;
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

    return {
      eventsCount,
      bookingsCount,
      totalRevenue,
      usersCount,
    };
  },
};

export default userService;
