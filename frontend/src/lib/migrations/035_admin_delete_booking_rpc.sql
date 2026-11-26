-- ============================================================
-- 035_admin_delete_booking_rpc.sql
-- Function to delete/cancel a booking and restore table seat occupancy
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_booking(
  p_booking_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_booking RECORD;
  v_affected_tables INT := 0;
BEGIN
  -- 1. Check if booking exists
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  -- 2. Release table occupancy for each booking item
  FOR v_item IN
    SELECT table_id, seats_count
    FROM public.booking_items
    WHERE booking_id = p_booking_id
  LOOP
    IF v_item.table_id IS NOT NULL THEN
      UPDATE public.tables
      SET
        booked_seats = GREATEST(0, COALESCE(booked_seats, 0) - COALESCE(v_item.seats_count, 1)),
        status = CASE
          WHEN GREATEST(0, COALESCE(booked_seats, 0) - COALESCE(v_item.seats_count, 1)) = 0 THEN 'available'
          WHEN GREATEST(0, COALESCE(booked_seats, 0) - COALESCE(v_item.seats_count, 1)) < capacity THEN 'available'
          ELSE 'sold'
        END,
        booking_id = CASE
          WHEN GREATEST(0, COALESCE(booked_seats, 0) - COALESCE(v_item.seats_count, 1)) = 0 THEN NULL
          ELSE booking_id
        END,
        updated_at = now()
      WHERE id = v_item.table_id;

      v_affected_tables := v_affected_tables + 1;
    END IF;
  END LOOP;

  -- 3. Also clear any table directly pointing to this booking_id
  UPDATE public.tables
  SET
    booking_id = NULL,
    updated_at = now()
  WHERE booking_id = p_booking_id;

  -- 4. Delete the booking record (cascades to booking_items, tickets, payments)
  DELETE FROM public.bookings
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking deleted successfully and table capacity restored',
    'booking_id', p_booking_id,
    'affected_tables', v_affected_tables
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_booking(UUID) TO anon, authenticated, service_role;
