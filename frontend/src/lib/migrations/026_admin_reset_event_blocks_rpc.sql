-- ============================================================
-- Khaleeji Tour — Migration 026: Admin Reset Event Blocks RPC
-- Resets all admin manual blocks on a seat map and restores
-- true natural table status based on active/paid customer bookings.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_reset_event_blocks(p_seat_map_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- 1. Reset all admin flags on this seat map and recalculate from actual bookings
  UPDATE public.tables t
  SET is_admin_blocked = false,
      admin_blocked_seats = 0,
      booked_seats = COALESCE((
        SELECT SUM(bi.seats_count)
        FROM public.booking_items bi
        JOIN public.bookings b ON b.id = bi.booking_id
        WHERE bi.table_id = t.id 
          AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
      ), 0),
      status = CASE 
        WHEN COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
        ), 0) >= t.capacity THEN 'sold'
        WHEN COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
        ), 0) > 0 THEN 'reserved'
        ELSE 'available'
      END,
      booking_id = CASE 
        WHEN COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PENDING' AND b.reserved_until > now())
        ), 0) > 0 THEN t.booking_id
        ELSE NULL
      END,
      reserved_until = CASE 
        WHEN COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PENDING' AND b.reserved_until > now())
        ), 0) > 0 THEN t.reserved_until
        ELSE NULL
      END,
      reserved_by = CASE 
        WHEN COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PENDING' AND b.reserved_until > now())
        ), 0) > 0 THEN t.reserved_by
        ELSE NULL
      END,
      updated_at = now()
  WHERE t.seat_map_id = p_seat_map_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'seat_map_id', p_seat_map_id,
    'updated_tables', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
