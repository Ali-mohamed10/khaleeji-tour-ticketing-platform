-- ============================================================
-- Migration 018: Complete Production Reset for Tables & Seats
-- Khaleeji Tour Production Launch Cleanup
-- ============================================================

DO $$
BEGIN
  -- 1. Clear seat_holds if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seat_holds') THEN
    EXECUTE 'DELETE FROM public.seat_holds;';
  END IF;

  -- 2. Clear booking_tables if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_tables') THEN
    EXECUTE 'DELETE FROM public.booking_tables;';
  END IF;

  -- 3. Clear tickets if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    EXECUTE 'DELETE FROM public.tickets;';
  END IF;

  -- 4. Clear payments if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'DELETE FROM public.payments;';
  END IF;

  -- 5. Clear booking_items if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_items') THEN
    EXECUTE 'DELETE FROM public.booking_items;';
  END IF;

  -- 6. Clear bookings if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'DELETE FROM public.bookings;';
  END IF;

  -- 7. Reset all tables to 'available' and booked_seats to 0 (Full seat capacity)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tables' AND column_name = 'booked_seats'
  ) THEN
    EXECUTE 'UPDATE public.tables SET status = ''available'', booked_seats = 0, updated_at = NOW();';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tables') THEN
    EXECUTE 'UPDATE public.tables SET status = ''available'', updated_at = NOW();';
  END IF;
END $$;

-- Verification Query (Should show all tables as available with 0 booked seats)
SELECT status, COUNT(*) AS count 
FROM public.tables 
GROUP BY status;
