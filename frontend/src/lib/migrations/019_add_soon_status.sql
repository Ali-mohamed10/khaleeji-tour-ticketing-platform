-- ============================================================
-- Migration 019: Support 'soon' (Coming Soon) Event Status
-- Khaleeji Tour Events System
-- ============================================================

DO $$
BEGIN
  -- 1. Drop existing CHECK constraint on events.status if present
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

  -- 2. Add new CHECK constraint allowing 'draft', 'published', 'soon', 'cancelled', 'completed'
  ALTER TABLE public.events 
    ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'published', 'soon', 'cancelled', 'completed'));

  -- 3. Make schedule and venue columns nullable for 'soon' teaser events
  ALTER TABLE public.events ALTER COLUMN start_date DROP NOT NULL;
  ALTER TABLE public.events ALTER COLUMN end_date DROP NOT NULL;
  ALTER TABLE public.events ALTER COLUMN country_en DROP NOT NULL;
  ALTER TABLE public.events ALTER COLUMN city_en DROP NOT NULL;
  ALTER TABLE public.events ALTER COLUMN venue_en DROP NOT NULL;

  -- 4. Update Public RLS policy to allow public visitors to read 'published' and 'soon' events
  DROP POLICY IF EXISTS "Public can view published events" ON public.events;
  DROP POLICY IF EXISTS "Public can view published and soon events" ON public.events;

  CREATE POLICY "Public can view published and soon events" 
    ON public.events 
    FOR SELECT 
    USING (status IN ('published', 'soon'));

END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
