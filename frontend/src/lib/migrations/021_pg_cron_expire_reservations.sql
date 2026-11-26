-- ============================================================
-- Migration 021: Enable pg_cron for automatic expired reservation cleanup
-- 
-- Purpose: Schedule expire_stale_reservations() to run every 2 minutes
--          directly inside Supabase PostgreSQL, so expired PENDING
--          bookings are cleaned up automatically without relying
--          on external cron services or page visits.
--
-- Prerequisites: pg_cron extension must be enabled in Supabase
--   Dashboard → Database → Extensions → search "pg_cron" → Enable
-- ============================================================

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Remove any existing job with the same name (idempotent)
SELECT cron.unschedule('expire-stale-reservations')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-reservations'
);

-- 3. Schedule expire_stale_reservations() to run every 2 minutes
SELECT cron.schedule(
  'expire-stale-reservations',          -- job name
  '*/2 * * * *',                        -- every 2 minutes
  $$SELECT public.expire_stale_reservations()$$  -- SQL to execute
);
