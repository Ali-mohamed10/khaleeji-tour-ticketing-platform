-- ============================================================
-- Khaleeji Tour — Migration 016: Seat Map Realtime Sync & booked_seats
-- ============================================================

-- 1. Add booked_seats column to tables table if not exists
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS booked_seats INTEGER NOT NULL DEFAULT 0;

-- 2. Update reserve_tables_for_booking to support partial seat booking and increment booked_seats
CREATE OR REPLACE FUNCTION public.reserve_tables_for_booking(
  p_event_id UUID,
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_table_selections JSONB, -- Array of objects: [{"table_id": "...", "seats_count": 2}]
  p_reservation_minutes INT DEFAULT 15
)
RETURNS JSONB AS $$
DECLARE
  v_table_item JSONB;
  v_table_id UUID;
  v_seats_count INT;
  v_current_status TEXT;
  v_capacity INT;
  v_current_booked INT;
  v_table_price NUMERIC(10,2);
  v_subtotal NUMERIC(10,2);
  v_ticket_total NUMERIC(10,2) := 0;
  v_service_fee NUMERIC(10,2) := 0;
  v_grand_total NUMERIC(10,2) := 0;
  v_booking_id UUID;
  v_reserved_until TIMESTAMPTZ;
  v_currency TEXT := 'CAD';
BEGIN
  -- Set expiration time
  v_reserved_until := now() + (p_reservation_minutes || ' minutes')::interval;

  -- 1. Auto-cleanup any expired bookings & table holds first
  PERFORM public.expire_stale_reservations();

  -- 2. Lock & Validate all requested tables (Prevent Race Conditions)
  FOR v_table_item IN SELECT * FROM jsonb_array_elements(p_table_selections)
  LOOP
    v_table_id := (v_table_item->>'table_id')::UUID;
    v_seats_count := (v_table_item->>'seats_count')::INT;

    -- Row level lock
    SELECT status, capacity, COALESCE(booked_seats, 0), price 
    INTO v_current_status, v_capacity, v_current_booked, v_table_price
    FROM public.tables
    WHERE id = v_table_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Table with ID % not found', v_table_id;
    END IF;

    IF v_current_status = 'sold' OR v_current_status = 'disabled' THEN
      RAISE EXCEPTION 'Table is sold out or disabled (ID: %)', v_table_id;
    END IF;

    IF (v_current_booked + v_seats_count) > v_capacity THEN
      RAISE EXCEPTION 'Not enough seats available at table (Requested: %, Available: %)', 
        v_seats_count, (v_capacity - v_current_booked);
    END IF;

    v_subtotal := v_table_price * v_seats_count;
    v_ticket_total := v_ticket_total + v_subtotal;
  END LOOP;

  -- Calculate 5% service fee and grand total
  v_service_fee := v_ticket_total * 0.05;
  v_grand_total := v_ticket_total + v_service_fee;

  -- Get event currency if available
  SELECT currency INTO v_currency FROM public.events WHERE id = p_event_id;
  IF v_currency IS NULL THEN
    v_currency := 'CAD';
  END IF;

  -- 3. Create Booking Record
  INSERT INTO public.bookings (
    user_id,
    event_id,
    status,
    reserved_until,
    total_amount,
    currency,
    customer_name,
    customer_email,
    customer_phone
  ) VALUES (
    p_user_id,
    p_event_id,
    'PENDING',
    v_reserved_until,
    v_grand_total,
    v_currency,
    p_customer_name,
    p_customer_email,
    p_customer_phone
  ) RETURNING id INTO v_booking_id;

  -- 4. Create Booking Items & Update Tables to Reserved
  FOR v_table_item IN SELECT * FROM jsonb_array_elements(p_table_selections)
  LOOP
    v_table_id := (v_table_item->>'table_id')::UUID;
    v_seats_count := (v_table_item->>'seats_count')::INT;

    SELECT price, capacity, COALESCE(booked_seats, 0) 
    INTO v_table_price, v_capacity, v_current_booked 
    FROM public.tables WHERE id = v_table_id;
    
    v_subtotal := v_table_price * v_seats_count;

    INSERT INTO public.booking_items (
      booking_id,
      table_id,
      seats_count,
      unit_price,
      subtotal
    ) VALUES (
      v_booking_id,
      v_table_id,
      v_seats_count,
      v_table_price,
      v_subtotal
    );

    UPDATE public.tables
    SET status = CASE 
          WHEN (v_current_booked + v_seats_count) >= v_capacity THEN 'reserved'
          ELSE 'reserved'
        END,
        booked_seats = v_current_booked + v_seats_count,
        booking_id = v_booking_id,
        reserved_until = v_reserved_until,
        reserved_by = p_user_id,
        updated_at = now()
    WHERE id = v_table_id;
  END LOOP;

  -- 5. Return success result
  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'total_amount', v_grand_total,
    'currency', v_currency,
    'reserved_until', v_reserved_until
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update confirm_booking_payment to update updated_at and set 'sold' ONLY if fully booked
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
  p_booking_id UUID,
  p_stripe_payment_intent_id TEXT,
  p_stripe_event_id TEXT,
  p_amount NUMERIC,
  p_currency TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_booking_record RECORD;
BEGIN
  -- Lock booking row
  SELECT * INTO v_booking_record FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found: %', p_booking_id;
  END IF;

  IF v_booking_record.status = 'PAID' THEN
    -- Already paid (idempotent response)
    RETURN jsonb_build_object('success', true, 'message', 'Booking already paid', 'booking_id', p_booking_id);
  END IF;

  -- 1. Update Booking status -> PAID
  UPDATE public.bookings
  SET status = 'PAID',
      stripe_payment_intent_id = p_stripe_payment_intent_id,
      updated_at = now()
  WHERE id = p_booking_id;

  -- 2. Update Tables status: only 'sold' if booked_seats >= capacity, otherwise 'reserved'
  UPDATE public.tables t
  SET status = CASE 
        WHEN COALESCE(t.booked_seats, 0) >= t.capacity THEN 'sold'
        ELSE 'reserved'
      END,
      reserved_until = NULL,
      updated_at = now()
  WHERE t.id IN (
    SELECT bi.table_id FROM public.booking_items bi WHERE bi.booking_id = p_booking_id
  );

  -- 3. Log Payment Record
  INSERT INTO public.payments (
    booking_id,
    stripe_payment_intent_id,
    amount,
    currency,
    status,
    stripe_event_id
  ) VALUES (
    p_booking_id,
    p_stripe_payment_intent_id,
    p_amount,
    COALESCE(p_currency, 'CAD'),
    'succeeded',
    p_stripe_event_id
  ) ON CONFLICT (stripe_event_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'customer_name', v_booking_record.customer_name,
    'customer_email', v_booking_record.customer_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update fail_booking_payment to recalculate booked_seats
CREATE OR REPLACE FUNCTION public.fail_booking_payment(
  p_booking_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update booking
  UPDATE public.bookings
  SET status = 'FAILED',
      updated_at = now()
  WHERE id = p_booking_id AND status = 'PENDING';

  -- Release tables by recalculating booked_seats
  UPDATE public.tables t
  SET booked_seats = COALESCE((
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
      updated_at = now()
  WHERE t.id IN (
    SELECT bi.table_id FROM public.booking_items bi WHERE bi.booking_id = p_booking_id
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update expire_stale_reservations to recalculate booked_seats
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INT := 0;
BEGIN
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
  UPDATE public.tables t
  SET booked_seats = COALESCE((
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
      updated_at = now()
  WHERE t.id IN (SELECT table_id FROM affected_tables);

  SELECT count(*) INTO v_expired_count FROM public.bookings WHERE status = 'EXPIRED';
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recalculate status for all existing tables based on capacity vs booked_seats
UPDATE public.tables
SET status = CASE 
      WHEN booked_seats >= capacity THEN 'sold'
      WHEN booked_seats > 0 THEN 'reserved'
      ELSE 'available'
    END,
    updated_at = now();

-- 7. Add tables to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
  END IF;
END $$;

-- 8. Reload schema cache
NOTIFY pgrst, 'reload schema';
