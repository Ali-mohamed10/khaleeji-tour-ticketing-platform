-- ============================================================
-- Khaleeji Tour — Migration 025: Admin Blocked Seats Persistence
-- Adds admin_blocked_seats & is_admin_blocked columns to tables
-- and updates expire_stale_reservations & admin_set_table_block_status
-- so admin blocks are never overwritten or reset by cron/cleanup.
-- ============================================================

-- 1. Add admin columns
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS is_admin_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_blocked_seats INTEGER NOT NULL DEFAULT 0;

-- 2. Update admin_set_table_block_status RPC
CREATE OR REPLACE FUNCTION public.admin_set_table_block_status(
  p_table_id UUID,
  p_is_blocked BOOLEAN,
  p_custom_seats INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_table RECORD;
  v_admin_seats INT;
  v_online_seats INT := 0;
  v_total_booked INT := 0;
  v_new_status TEXT;
BEGIN
  -- Lock row
  SELECT * INTO v_table FROM public.tables WHERE id = p_table_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table with ID % not found', p_table_id;
  END IF;

  -- Calculate online active/paid bookings
  SELECT COALESCE(SUM(bi.seats_count), 0) INTO v_online_seats
  FROM public.booking_items bi
  JOIN public.bookings b ON b.id = bi.booking_id
  WHERE bi.table_id = p_table_id 
    AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()));

  IF p_is_blocked THEN
    IF p_custom_seats IS NOT NULL AND p_custom_seats >= 0 AND p_custom_seats <= v_table.capacity THEN
      v_admin_seats := p_custom_seats;
    ELSE
      v_admin_seats := v_table.capacity;
    END IF;

    v_total_booked := LEAST(v_table.capacity, v_admin_seats + v_online_seats);

    IF v_total_booked >= v_table.capacity THEN
      v_new_status := 'sold';
    ELSIF v_total_booked > 0 THEN
      v_new_status := 'reserved';
    ELSE
      v_new_status := 'available';
    END IF;

    UPDATE public.tables
    SET is_admin_blocked = (v_admin_seats > 0),
        admin_blocked_seats = v_admin_seats,
        booked_seats = v_total_booked,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_table_id;

  ELSE
    -- Unblock admin portion completely
    v_admin_seats := 0;
    v_total_booked := v_online_seats;

    IF v_total_booked >= v_table.capacity THEN
      v_new_status := 'sold';
    ELSIF v_total_booked > 0 THEN
      v_new_status := 'reserved';
    ELSE
      v_new_status := 'available';
    END IF;

    UPDATE public.tables
    SET is_admin_blocked = false,
        admin_blocked_seats = 0,
        booked_seats = v_total_booked,
        status = v_new_status,
        booking_id = CASE WHEN v_online_seats > 0 THEN booking_id ELSE NULL END,
        reserved_until = CASE WHEN v_online_seats > 0 THEN reserved_until ELSE NULL END,
        reserved_by = CASE WHEN v_online_seats > 0 THEN reserved_by ELSE NULL END,
        updated_at = now()
    WHERE id = p_table_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'table_id', p_table_id,
    'status', v_new_status,
    'booked_seats', v_total_booked,
    'admin_blocked_seats', v_admin_seats,
    'capacity', v_table.capacity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update expire_stale_reservations RPC to preserve admin_blocked_seats
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INT := 0;
BEGIN
  -- 1. Mark expired PENDING bookings as EXPIRED
  WITH expired_bookings AS (
    UPDATE public.bookings
    SET status = 'EXPIRED',
        updated_at = now()
    WHERE status = 'PENDING' AND reserved_until < now()
    RETURNING id
  ),
  affected_tables AS (
    SELECT DISTINCT table_id FROM public.booking_items
    WHERE booking_id IN (SELECT id FROM expired_bookings)
  )
  -- 2. Recalculate booked_seats and status for affected tables (preserving admin_blocked_seats)
  UPDATE public.tables t
  SET booked_seats = LEAST(t.capacity, COALESCE(t.admin_blocked_seats, 0) + COALESCE((
        SELECT SUM(bi.seats_count)
        FROM public.booking_items bi
        JOIN public.bookings b ON b.id = bi.booking_id
        WHERE bi.table_id = t.id 
          AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
      ), 0)),
      status = CASE 
        WHEN (COALESCE(t.admin_blocked_seats, 0) + COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
        ), 0)) >= t.capacity THEN 'sold'
        WHEN (COALESCE(t.admin_blocked_seats, 0) + COALESCE((
          SELECT SUM(bi.seats_count)
          FROM public.booking_items bi
          JOIN public.bookings b ON b.id = bi.booking_id
          WHERE bi.table_id = t.id 
            AND (b.status = 'PAID' OR (b.status = 'PENDING' AND b.reserved_until > now()))
        ), 0)) > 0 THEN 'reserved'
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
  WHERE t.id IN (SELECT table_id FROM affected_tables)
     OR (t.reserved_until IS NOT NULL AND t.reserved_until < now());

  SELECT count(*) INTO v_expired_count FROM public.bookings WHERE status = 'EXPIRED';
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
