-- Migration 036: Performance indexes + optional event cover thumbnails
-- Additive only — does not change RLS policies or business logic.

-- 1. Lean list / status filtering
CREATE INDEX IF NOT EXISTS idx_events_status_start_date
  ON public.events (status, start_date);

-- 2. High-value FK indexes (Supabase performance advisor)
CREATE INDEX IF NOT EXISTS idx_bookings_event_id
  ON public.bookings (event_id);

CREATE INDEX IF NOT EXISTS idx_tickets_booking_id
  ON public.tickets (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id
  ON public.booking_items (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_items_table_id
  ON public.booking_items (table_id);

CREATE INDEX IF NOT EXISTS idx_events_category_id
  ON public.events (category_id);

CREATE INDEX IF NOT EXISTS idx_events_seat_map_id
  ON public.events (seat_map_id);

CREATE INDEX IF NOT EXISTS idx_event_videos_event_id
  ON public.event_videos (event_id);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id
  ON public.payments (booking_id);

-- 3. Optional cover thumbnail URL for card list loading (500px sibling uploads)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
