-- ============================================================
-- Khaleeji Tour — Migration 027: Event Videos Management & Storage
-- Enables video promo uploading, linking to events, placements,
-- and automated WebP poster optimization.
-- ============================================================

-- 1. Create storage bucket for event videos if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-videos',
  'event-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800;

-- 2. Storage Policies for event-videos bucket
DROP POLICY IF EXISTS "Public can view event videos" ON storage.objects;
CREATE POLICY "Public can view event videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-videos');

DROP POLICY IF EXISTS "Admins can upload event videos" ON storage.objects;
CREATE POLICY "Admins can upload event videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-videos' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Admins can delete event videos" ON storage.objects;
CREATE POLICY "Admins can delete event videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-videos' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- 3. Create event_videos table
CREATE TABLE IF NOT EXISTS public.event_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL DEFAULT 'Tour Promo',
  title_ar TEXT NOT NULL DEFAULT 'الإعلان الترويجي',
  description_en TEXT,
  description_ar TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '9:16', -- '9:16' or '16:9'
  placement TEXT NOT NULL DEFAULT 'event_details', -- 'event_details', 'home_reel', 'how_it_works', 'all'
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  duration_seconds INTEGER DEFAULT 70,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_videos ENABLE ROW LEVEL SECURITY;

-- Policies for event_videos table
DROP POLICY IF EXISTS "Public can view active event videos" ON public.event_videos;
CREATE POLICY "Public can view active event videos"
  ON public.event_videos FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage event videos" ON public.event_videos;
CREATE POLICY "Admins can manage event videos"
  ON public.event_videos FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
