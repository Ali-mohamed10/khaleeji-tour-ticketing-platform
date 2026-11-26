-- ============================================================
-- Khaleeji Tour — Migration 031: Add QR Code to Event Registrations
-- Adds qr_code_url column to store generated QR code (base64 data URL or image URL),
-- creates secure RPC to update QR code, and updates submit_event_registration.
-- ============================================================

-- 1. Add qr_code_url column
ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- 2. Stored Procedure to securely update QR code (callable by anon, authenticated, service_role)
CREATE OR REPLACE FUNCTION public.update_registration_qr_code(
  p_registration_id UUID,
  p_qr_code_url TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.event_registrations
  SET 
    qr_code_url = p_qr_code_url,
    updated_at = now()
  WHERE id = p_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_registration_qr_code TO anon, authenticated, service_role;

-- 3. Update submit_event_registration to accept optional p_qr_code_url
DROP FUNCTION IF EXISTS public.submit_event_registration(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.submit_event_registration(
  p_full_name TEXT,
  p_email TEXT,
  p_phone_number TEXT,
  p_city TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'Guest',
  p_organization_name TEXT DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL,
  p_discovery_source TEXT DEFAULT NULL,
  p_preferred_language TEXT DEFAULT 'ar',
  p_event_id UUID DEFAULT NULL,
  p_event_title TEXT DEFAULT 'The 4th Press Conference',
  p_notes TEXT DEFAULT NULL,
  p_qr_code_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_inserted public.event_registrations%ROWTYPE;
BEGIN
  INSERT INTO public.event_registrations (
    full_name,
    email,
    phone_number,
    city,
    category,
    organization_name,
    job_title,
    discovery_source,
    preferred_language,
    event_id,
    event_title,
    notes,
    status,
    confirmation_email_status,
    qr_code_url
  ) VALUES (
    p_full_name,
    lower(trim(p_email)),
    trim(p_phone_number),
    p_city,
    p_category,
    p_organization_name,
    p_job_title,
    p_discovery_source,
    p_preferred_language,
    p_event_id,
    p_event_title,
    p_notes,
    'registered',
    'pending',
    p_qr_code_url
  )
  RETURNING * INTO v_inserted;

  RETURN to_jsonb(v_inserted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_event_registration TO anon, authenticated, service_role;
