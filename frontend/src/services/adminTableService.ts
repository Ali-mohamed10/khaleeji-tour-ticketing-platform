/**
 * Admin Table Service
 *
 * Provides functions for admins to view, block (mark sold/reserved),
 * and unblock (release to available) tables in event seat maps.
 */
import { supabase } from '../lib/supabaseClient';

export interface AdminTable {
  id: string;
  seat_map_id: string;
  table_code: string;
  svg_element_id: string;
  category: string;
  capacity: number;
  price: number;
  status: 'available' | 'reserved' | 'sold' | 'held' | 'disabled';
  booked_seats: number;
  is_admin_blocked?: boolean;
  admin_blocked_seats?: number;
  position_x?: number;
  position_y?: number;
  updated_at?: string;
}

export const adminTableService = {
  /**
   * Fetch all tables for a given seat map
   */
  async getTablesBySeatMapId(seatMapId: string): Promise<AdminTable[]> {
    if (!seatMapId) return [];

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('seat_map_id', seatMapId)
      .order('svg_element_id', { ascending: true });

    if (error) {
      console.error('Error fetching tables for admin:', error);
      throw error;
    }

    // Sort naturally by table number (e.g. #1, #2, ... #10 instead of alphabetical)
    return (data || []).sort((a, b) => {
      const numA = parseInt((a.svg_element_id || a.table_code || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.svg_element_id || b.table_code || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  },

  /**
   * Block or Unblock a single table atomically using RPC
   */
  async setTableBlockStatus(params: {
    tableId: string;
    isBlocked: boolean;
    customSeats?: number | null;
  }) {
    const { tableId, isBlocked, customSeats = null } = params;

    // Try RPC first for atomic transaction & row locking
    const { data, error } = await supabase.rpc('admin_set_table_block_status', {
      p_table_id: tableId,
      p_is_blocked: isBlocked,
      p_custom_seats: customSeats,
    });

    if (!error && data) {
      return data;
    }

    if (error) {
      console.warn('RPC admin_set_table_block_status fallback to direct table update:', error.message);
    }

    // Fallback direct update
    if (isBlocked) {
      const updateData: Record<string, unknown> = {
        status: 'sold',
        updated_at: new Date().toISOString(),
      };
      if (customSeats !== null && customSeats !== undefined) {
        updateData.booked_seats = customSeats;
      }
      const { data: updated, error: uErr } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId)
        .select()
        .single();

      if (uErr) throw uErr;
      return updated;
    } else {
      const { data: updated, error: uErr } = await supabase
        .from('tables')
        .update({
          status: 'available',
          booked_seats: 0,
          booking_id: null,
          reserved_until: null,
          reserved_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (uErr) throw uErr;
      return updated;
    }
  },

  /**
   * Bulk block or unblock multiple tables
   */
  async bulkSetBlockStatus(params: {
    tableIds: string[];
    isBlocked: boolean;
  }) {
    const { tableIds, isBlocked } = params;
    const promises = tableIds.map((id) =>
      this.setTableBlockStatus({ tableId: id, isBlocked })
    );
    return Promise.all(promises);
  },

  /**
   * Reset all manual admin blocks on an event seat map and restore
   * true status based on actual PAID / active bookings.
   */
  async resetEventBlocks(seatMapId: string): Promise<{ success: boolean; updated_tables: number }> {
    if (!seatMapId) return { success: false, updated_tables: 0 };

    const { data, error } = await supabase.rpc('admin_reset_event_blocks', {
      p_seat_map_id: seatMapId,
    });

    if (error) {
      console.error('Error resetting event blocks:', error);
      throw error;
    }

    return data;
  },
};

export default adminTableService;
