-- ============================================================
-- Khaleeji Tour — Ticket Verification & Gate Check-in System
-- ============================================================

-- 1. Add check-in columns to tickets table
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_is_used ON public.tickets(is_used);

-- 2. Atomic RPC function for gate check-in
CREATE OR REPLACE FUNCTION public.verify_and_check_in_ticket(
  p_ticket_code TEXT,
  p_check_in BOOLEAN DEFAULT true,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_booking RECORD;
  v_event RECORD;
  v_tables JSONB;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Trim and uppercase ticket code
  p_ticket_code := TRIM(UPPER(p_ticket_code));

  -- 1. Find ticket
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE UPPER(ticket_code) = p_ticket_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'message', 'Ticket not found. Invalid ticket code.'
    );
  END IF;

  -- 2. Fetch associated booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_ticket.booking_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'message', 'Booking record not found for this ticket.'
    );
  END IF;

  -- 3. Check booking status
  IF v_booking.status != 'PAID' THEN
    RETURN jsonb_build_object(
      'status', 'NOT_PAID',
      'booking_status', v_booking.status,
      'message', 'Payment has not been confirmed for this ticket.'
    );
  END IF;

  -- 4. Fetch event details
  SELECT id, title_en, title_ar, venue_en, venue_ar, start_date, end_date, cover_image_url
  INTO v_event
  FROM public.events
  WHERE id = v_booking.event_id
  LIMIT 1;

  -- 5. Fetch reserved tables
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', COALESCE(t.name, 'Table #' || t.table_number),
      'table_number', t.table_number,
      'seats_count', bi.seats_count,
      'price', bi.unit_price
    )
  ) INTO v_tables
  FROM public.booking_items bi
  JOIN public.tables t ON t.id = bi.table_id
  WHERE bi.booking_id = v_booking.id;

  -- 6. Check if ticket already used
  IF v_ticket.is_used THEN
    RETURN jsonb_build_object(
      'status', 'ALREADY_USED',
      'message', 'Ticket has already been used for entry.',
      'used_at', v_ticket.used_at,
      'ticket', jsonb_build_object(
        'id', v_ticket.id,
        'ticket_code', v_ticket.ticket_code,
        'customer_name', v_ticket.customer_name,
        'created_at', v_ticket.created_at,
        'is_used', true,
        'used_at', v_ticket.used_at
      ),
      'booking', jsonb_build_object(
        'id', v_booking.id,
        'total_amount', v_booking.total_amount,
        'currency', v_booking.currency,
        'customer_email', v_booking.customer_email,
        'customer_phone', v_booking.customer_phone
      ),
      'event', to_jsonb(v_event),
      'tables', COALESCE(v_tables, '[]'::jsonb)
    );
  END IF;

  -- 7. If p_check_in is TRUE, mark ticket as used
  IF p_check_in THEN
    UPDATE public.tickets
    SET 
      is_used = true,
      used_at = v_now,
      checked_in_by = p_admin_id
    WHERE id = v_ticket.id;
  END IF;

  -- 8. Return success response
  RETURN jsonb_build_object(
    'status', 'VALID',
    'message', CASE WHEN p_check_in THEN 'Ticket verified & Checked in successfully!' ELSE 'Ticket is valid and ready for check-in.' END,
    'checked_in_now', p_check_in,
    'used_at', v_now,
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'ticket_code', v_ticket.ticket_code,
      'customer_name', v_ticket.customer_name,
      'created_at', v_ticket.created_at,
      'is_used', p_check_in,
      'used_at', CASE WHEN p_check_in THEN v_now ELSE NULL END
    ),
    'booking', jsonb_build_object(
      'id', v_booking.id,
      'total_amount', v_booking.total_amount,
      'currency', v_booking.currency,
      'customer_email', v_booking.customer_email,
      'customer_phone', v_booking.customer_phone
    ),
    'event', to_jsonb(v_event),
    'tables', COALESCE(v_tables, '[]'::jsonb)
  );
END;
$$;
