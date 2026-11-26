-- ============================================================
-- Khaleeji Tour — Migration 024: Admin Table Block / Unblock RPC
-- Allows admins to block (mark as sold/reserved) or unblock (available)
-- specific tables and seats without creating financial bookings.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_set_table_block_status(
  p_table_id UUID,
  p_is_blocked BOOLEAN,
  p_custom_seats INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_table RECORD;
  v_new_booked INT;
  v_new_status TEXT;
BEGIN
  -- Lock row to prevent concurrent race conditions
  SELECT * INTO v_table FROM public.tables WHERE id = p_table_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table with ID % not found', p_table_id;
  END IF;

  IF p_is_blocked THEN
    -- If custom seat count provided, use it, otherwise block full table capacity
    IF p_custom_seats IS NOT NULL AND p_custom_seats >= 0 AND p_custom_seats <= v_table.capacity THEN
      v_new_booked := p_custom_seats;
    ELSE
      v_new_booked := v_table.capacity;
    END IF;
    
    IF v_new_booked >= v_table.capacity THEN
      v_new_status := 'sold';
    ELSIF v_new_booked > 0 THEN
      v_new_status := 'reserved';
    ELSE
      v_new_status := 'available';
    END IF;
  ELSE
    -- Unblock completely
    v_new_booked := 0;
    v_new_status := 'available';
  END IF;

  UPDATE public.tables
  SET status = v_new_status,
      booked_seats = v_new_booked,
      booking_id = CASE WHEN v_new_status = 'available' THEN NULL ELSE booking_id END,
      reserved_until = CASE WHEN v_new_status = 'available' THEN NULL ELSE reserved_until END,
      reserved_by = CASE WHEN v_new_status = 'available' THEN NULL ELSE reserved_by END,
      updated_at = now()
  WHERE id = p_table_id;

  RETURN jsonb_build_object(
    'success', true,
    'table_id', p_table_id,
    'status', v_new_status,
    'booked_seats', v_new_booked,
    'capacity', v_table.capacity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
