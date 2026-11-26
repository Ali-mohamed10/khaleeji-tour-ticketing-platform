-- ============================================================
-- Khaleeji Tour — Migration 033: Manual Offline Booking RPC
-- Purpose: Supports offline Cash / WhatsApp reservations created
--          from the Admin Dashboard, locking tables and generating
--          PAID bookings with tickets, HST 13% tax, and confirmation emails.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_manual_offline_booking(
  p_event_id UUID,
  p_table_id UUID,
  p_seats_count INT,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'Cash / WhatsApp',
  p_custom_amount NUMERIC DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_table RECORD;
  v_event RECORD;
  v_booking_id UUID;
  v_unit_price NUMERIC(10,2);
  v_subtotal NUMERIC(10,2);
  v_tax NUMERIC(10,2) := 0;
  v_grand_total NUMERIC(10,2);
  v_new_booked_seats INT;
  v_new_status TEXT;
  v_currency TEXT := 'CAD';
  v_unique_ref TEXT;
BEGIN
  -- 1. Validate seats count
  IF p_seats_count IS NULL OR p_seats_count <= 0 THEN
    RAISE EXCEPTION 'Seats count must be greater than zero';
  END IF;

  -- 2. Validate email
  IF p_customer_email IS NULL OR TRIM(p_customer_email) = '' THEN
    RAISE EXCEPTION 'Customer email is required';
  END IF;

  -- 3. Lock table row to prevent concurrent race conditions
  SELECT * INTO v_table FROM public.tables WHERE id = p_table_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found (ID: %)', p_table_id;
  END IF;

  -- 4. Validate event
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found (ID: %)', p_event_id;
  END IF;

  IF v_event.currency IS NOT NULL AND TRIM(v_event.currency) != '' THEN
    v_currency := v_event.currency;
  END IF;

  -- 5. Check table capacity
  IF (COALESCE(v_table.booked_seats, 0) + p_seats_count) > v_table.capacity THEN
    RAISE EXCEPTION 'Requested seats (%) exceed available capacity (%). Table capacity is %, currently booked is %',
      p_seats_count, (v_table.capacity - COALESCE(v_table.booked_seats, 0)), v_table.capacity, COALESCE(v_table.booked_seats, 0);
  END IF;

  -- 6. Calculate pricing with Ontario HST 13% Tax
  v_unit_price := COALESCE(v_table.price, 0);
  IF p_custom_amount IS NOT NULL AND p_custom_amount >= 0 THEN
    v_subtotal := p_custom_amount;
    v_tax := 0;
    v_grand_total := p_custom_amount;
  ELSE
    v_subtotal := v_unit_price * p_seats_count;
    v_tax := ROUND(v_subtotal * 0.13, 2);
    v_grand_total := v_subtotal + v_tax;
  END IF;

  v_unique_ref := replace(gen_random_uuid()::text, '-', '');

  -- 7. Insert PAID booking with Grand Total (inclusive of 13% HST)
  INSERT INTO public.bookings (
    event_id,
    user_id,
    status,
    total_amount,
    currency,
    customer_name,
    customer_email,
    customer_phone,
    stripe_checkout_session_id,
    stripe_payment_intent_id
  ) VALUES (
    p_event_id,
    p_admin_user_id,
    'PAID',
    v_grand_total,
    v_currency,
    COALESCE(NULLIF(TRIM(p_customer_name), ''), 'Valued Guest'),
    TRIM(p_customer_email),
    NULLIF(TRIM(p_customer_phone), ''),
    'MANUAL_OFFLINE_' || v_unique_ref,
    'OFFLINE_' || UPPER(COALESCE(NULLIF(TRIM(p_payment_method), ''), 'CASH')) || '_' || v_unique_ref
  ) RETURNING id INTO v_booking_id;

  -- 8. Insert booking item
  INSERT INTO public.booking_items (
    booking_id,
    table_id,
    seats_count,
    unit_price,
    subtotal
  ) VALUES (
    v_booking_id,
    p_table_id,
    p_seats_count,
    v_unit_price,
    v_subtotal
  );

  -- 9. Insert payment record
  INSERT INTO public.payments (
    booking_id,
    amount,
    currency,
    status,
    stripe_payment_intent_id,
    stripe_event_id
  ) VALUES (
    v_booking_id,
    v_grand_total,
    v_currency,
    'succeeded',
    'OFFLINE_' || UPPER(COALESCE(NULLIF(TRIM(p_payment_method), ''), 'CASH')) || '_' || v_unique_ref,
    'offline_evt_' || v_unique_ref
  );

  -- 10. Update table occupancy status
  v_new_booked_seats := COALESCE(v_table.booked_seats, 0) + p_seats_count;
  IF v_new_booked_seats >= v_table.capacity THEN
    v_new_status := 'sold';
  ELSE
    v_new_status := 'reserved';
  END IF;

  UPDATE public.tables
  SET booked_seats = v_new_booked_seats,
      status = v_new_status,
      booking_id = v_booking_id,
      updated_at = now()
  WHERE id = p_table_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'subtotal', v_subtotal,
    'tax_amount', v_tax,
    'total_amount', v_grand_total,
    'currency', v_currency,
    'table_code', v_table.table_code,
    'table_id', p_table_id,
    'seats_count', p_seats_count,
    'new_booked_seats', v_new_booked_seats,
    'table_capacity', v_table.capacity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_manual_offline_booking TO authenticated, service_role, anon;
