-- ============================================================
-- Khaleeji Tour — Migration 030: Registration Check-in System
-- Adds atomic gate check-in & verification RPC functions for
-- event registrations (conferences & special events).
-- ============================================================

-- 1. Atomic RPC for verifying and checking in registrations
CREATE OR REPLACE FUNCTION public.verify_and_check_in_registration(
  p_code TEXT,
  p_check_in BOOLEAN DEFAULT true,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reg RECORD;
  v_now TIMESTAMPTZ := now();
  v_is_uuid BOOLEAN;
BEGIN
  p_code := TRIM(p_code);

  -- Check if code matches UUID format
  v_is_uuid := p_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  IF v_is_uuid THEN
    SELECT * INTO v_reg
    FROM public.event_registrations
    WHERE id = p_code::UUID OR UPPER(registration_number) = UPPER(p_code)
    LIMIT 1;
  ELSE
    SELECT * INTO v_reg
    FROM public.event_registrations
    WHERE UPPER(registration_number) = UPPER(p_code)
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'message', 'Registration not found. Invalid registration number or QR code.',
      'isRegistration', true
    );
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'status', 'INVALID',
      'message', 'This registration has been cancelled.',
      'isRegistration', true
    );
  END IF;

  IF v_reg.status = 'attended' THEN
    RETURN jsonb_build_object(
      'status', 'ALREADY_USED',
      'message', 'Registration has already been used for entry.',
      'used_at', v_reg.updated_at,
      'isRegistration', true,
      'registration', jsonb_build_object(
        'id', v_reg.id,
        'registration_number', v_reg.registration_number,
        'full_name', v_reg.full_name,
        'email', v_reg.email,
        'phone_number', v_reg.phone_number,
        'category', v_reg.category,
        'event_title', v_reg.event_title,
        'organization_name', v_reg.organization_name,
        'job_title', v_reg.job_title,
        'status', v_reg.status
      ),
      'ticket', jsonb_build_object(
        'id', v_reg.id,
        'ticket_code', v_reg.registration_number,
        'customer_name', v_reg.full_name,
        'is_used', true,
        'used_at', v_reg.updated_at,
        'created_at', v_reg.created_at
      ),
      'event', jsonb_build_object(
        'id', COALESCE(v_reg.event_id::TEXT, 'press-conference'),
        'title_en', v_reg.event_title,
        'title_ar', 'المؤتمر الصحفي الرابع',
        'venue_en', 'HILM Venues – Mississauga, Ontario',
        'venue_ar', 'قاعات حِلم – ميسيساغا، أونتاريو'
      ),
      'tables', jsonb_build_array(
        jsonb_build_object(
          'table_name', COALESCE(v_reg.category, 'Guest Registration'),
          'seats_count', 1
        )
      )
    );
  END IF;

  -- If check-in requested, update status to attended
  IF p_check_in THEN
    UPDATE public.event_registrations
    SET status = 'attended',
        updated_at = v_now
    WHERE id = v_reg.id;
  END IF;

  RETURN jsonb_build_object(
    'status', 'VALID',
    'message', CASE WHEN p_check_in THEN 'Registration verified & Checked in successfully!' ELSE 'Registration is valid and ready for check-in.' END,
    'checked_in_now', p_check_in,
    'used_at', v_now,
    'isRegistration', true,
    'registration', jsonb_build_object(
      'id', v_reg.id,
      'registration_number', v_reg.registration_number,
      'full_name', v_reg.full_name,
      'email', v_reg.email,
      'phone_number', v_reg.phone_number,
      'category', v_reg.category,
      'event_title', v_reg.event_title,
      'organization_name', v_reg.organization_name,
      'job_title', v_reg.job_title,
      'status', CASE WHEN p_check_in THEN 'attended' ELSE 'registered' END
    ),
    'ticket', jsonb_build_object(
      'id', v_reg.id,
      'ticket_code', v_reg.registration_number,
      'customer_name', v_reg.full_name,
      'is_used', p_check_in,
      'used_at', CASE WHEN p_check_in THEN v_now ELSE NULL END,
      'created_at', v_reg.created_at
    ),
    'event', jsonb_build_object(
      'id', COALESCE(v_reg.event_id::TEXT, 'press-conference'),
      'title_en', v_reg.event_title,
      'title_ar', 'المؤتمر الصحفي الرابع',
      'venue_en', 'HILM Venues – Mississauga, Ontario',
      'venue_ar', 'قاعات حِلم – ميسيساغا، أونتاريو'
    ),
    'tables', jsonb_build_array(
      jsonb_build_object(
        'table_name', COALESCE(v_reg.category, 'Guest Registration'),
        'seats_count', 1
      )
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_and_check_in_registration(TEXT, BOOLEAN, UUID) TO anon, authenticated, service_role;

-- 2. Toggle registration check-in status (Manual check-in / Undo)
CREATE OR REPLACE FUNCTION public.toggle_registration_check_in(
  p_registration_id UUID,
  p_is_used BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reg RECORD;
  v_new_status TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_new_status := CASE WHEN p_is_used THEN 'attended' ELSE 'registered' END;

  UPDATE public.event_registrations
  SET status = v_new_status,
      updated_at = v_now
  WHERE id = p_registration_id
  RETURNING * INTO v_reg;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found with ID %', p_registration_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_reg.id,
    'registration_number', v_reg.registration_number,
    'full_name', v_reg.full_name,
    'status', v_reg.status,
    'is_used', p_is_used,
    'used_at', CASE WHEN p_is_used THEN v_now ELSE NULL END,
    'isRegistration', true
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.toggle_registration_check_in(UUID, BOOLEAN) TO anon, authenticated, service_role;

-- 3. Get registration attendees for scanner directory & statistics
CREATE OR REPLACE FUNCTION public.get_event_registrations_attendees(
  p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'registration_number', r.registration_number,
      'full_name', r.full_name,
      'email', r.email,
      'phone_number', r.phone_number,
      'category', r.category,
      'event_id', r.event_id,
      'event_title', r.event_title,
      'organization_name', r.organization_name,
      'job_title', r.job_title,
      'status', r.status,
      'created_at', r.created_at,
      'updated_at', r.updated_at
    )
    ORDER BY r.created_at DESC
  ) INTO v_result
  FROM public.event_registrations r
  WHERE r.status != 'cancelled'
    AND (
      p_event_id IS NULL 
      OR p_event_id = '' 
      OR (p_event_id = 'press-conference' AND (r.event_id IS NULL OR r.event_title ILIKE '%press conference%'))
      OR (p_event_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND r.event_id = p_event_id::UUID)
    );

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_event_registrations_attendees(TEXT) TO anon, authenticated, service_role;
