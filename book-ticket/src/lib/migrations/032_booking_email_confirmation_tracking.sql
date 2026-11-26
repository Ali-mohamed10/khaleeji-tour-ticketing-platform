-- ============================================================
-- Khaleeji Tour — Booking Confirmation Email Tracking & RPC
-- Migration: 032_booking_email_confirmation_tracking.sql
-- ============================================================

-- 1. Add confirmation_email_sent_at column to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

-- 2. Create SECURITY DEFINER RPC to mark booking email sent (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.mark_booking_email_sent(p_booking_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bookings
  SET confirmation_email_sent_at = now()
  WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.mark_booking_email_sent(UUID) TO anon, authenticated, service_role;
