-- ============================================================
-- Migration 023: Add Multiple Images Gallery Support for Events
-- ============================================================

-- 1. Add images column to public.events if it doesn't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Populate existing events' images array with cover_image_url if present and images is empty
UPDATE public.events
SET images = ARRAY[cover_image_url]
WHERE cover_image_url IS NOT NULL 
  AND (images IS NULL OR images = '{}');

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
