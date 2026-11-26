-- ============================================================
-- Migration 020: Update Service Fee / Tax Rate to Ontario HST 13%
-- Updates reserve_tables_for_booking RPC in Supabase PostgreSQL
-- ============================================================

CREATE OR REPLACE FUNCTION public.reserve_tables_for_booking(
  p_event_id UUID,
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_table_selections JSONB,
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

  -- Calculate Ontario HST 13% Tax and grand total
  v_service_fee := ROUND(v_ticket_total * 0.13, 2);
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

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
