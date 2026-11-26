-- ============================================================
-- Khaleeji Tour — Migration 029: Event Registrations System
-- Adds dedicated table for event registrations (e.g. The 4th Press Conference),
-- sequential registration number formatting (PC4-2026-XXXX),
-- audit timestamps, performance indexes, and secure RLS policies.
-- ============================================================

-- 1. Create Sequence for sequential Registration Numbering
CREATE SEQUENCE IF NOT EXISTS public.event_registration_seq START 1;

-- 2. Create Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_title TEXT NOT NULL DEFAULT 'The 4th Press Conference',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city TEXT,
  category TEXT NOT NULL, -- e.g. Guest, Media / Press, Photographer, Organization Representative, Artist, Sponsor, Volunteer, Other
  organization_name TEXT,
  job_title TEXT,
  discovery_source TEXT, -- e.g. Instagram, Website, Invitation, Media, Friend, Other
  preferred_language TEXT NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en', 'both')),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  confirmation_email_status TEXT NOT NULL DEFAULT 'pending' CHECK (confirmation_email_status IN ('pending', 'sent', 'failed')),
  confirmation_email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Automatic Registration Number Generator Trigger
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  IF NEW.registration_number IS NULL OR NEW.registration_number = '' THEN
    seq_val := nextval('public.event_registration_seq');
    NEW.registration_number := 'PC4-2026-' || LPAD(seq_val::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_registration_number ON public.event_registrations;
CREATE TRIGGER trg_set_registration_number
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_registration_number();

-- 4. Trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS handle_updated_at_event_registrations ON public.event_registrations;
CREATE TRIGGER handle_updated_at_event_registrations
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON public.event_registrations (lower(email));
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations (status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email_status ON public.event_registrations (confirmation_email_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_category ON public.event_registrations (category);
CREATE INDEX IF NOT EXISTS idx_event_registrations_reg_number ON public.event_registrations (registration_number);
CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON public.event_registrations (created_at DESC);

-- 6. Row Level Security (RLS)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy A: Public users (anon & authenticated) can submit a registration
DROP POLICY IF EXISTS "Public can submit event registration" ON public.event_registrations;
CREATE POLICY "Public can submit event registration" ON public.event_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy B: Admins, Editors & Service Role have full access (view, update, delete)
DROP POLICY IF EXISTS "Admins have full access to event registrations" ON public.event_registrations;
CREATE POLICY "Admins have full access to event registrations" ON public.event_registrations
  FOR ALL
  TO authenticated, service_role
  USING (
    public.is_editor_or_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_editor_or_admin()
    OR auth.role() = 'service_role'
  );

-- 7. Stored Procedure to securely submit an event registration (bypasses RLS returning full row)
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
  p_notes TEXT DEFAULT NULL
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
    confirmation_email_status
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
    'pending'
  )
  RETURNING * INTO v_inserted;

  RETURN to_jsonb(v_inserted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_event_registration TO anon, authenticated, service_role;

-- 8. Stored Procedure to update email status securely
CREATE OR REPLACE FUNCTION public.update_registration_email_status(
  p_registration_id UUID,
  p_status TEXT,
  p_sent_at TIMESTAMPTZ DEFAULT now()
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.event_registrations
  SET 
    confirmation_email_status = p_status,
    confirmation_email_sent_at = CASE WHEN p_status = 'sent' THEN p_sent_at ELSE confirmation_email_sent_at END,
    updated_at = now()
  WHERE id = p_registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_registration_email_status TO anon, authenticated, service_role;
