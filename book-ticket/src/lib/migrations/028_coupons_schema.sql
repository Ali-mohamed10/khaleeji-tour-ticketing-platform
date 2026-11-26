-- ============================================================
-- Khaleeji Tour — Migration 028: Discount Coupons System
-- Allows creation of promo codes, percentage discounts,
-- multi-event selection or global scoping, usage tracking, and RLS.
-- ============================================================

-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE, -- Optional single event FK
  event_ids UUID[] DEFAULT NULL, -- Array of eligible event UUIDs (NULL or empty = All events)
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0), -- NULL means unlimited
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  valid_from TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure event_ids column exists if table already created
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS event_ids UUID[] DEFAULT NULL;

-- 2. Add Coupon tracking columns to Bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10,2) DEFAULT 0;

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (upper(code));
CREATE INDEX IF NOT EXISTS idx_coupons_event_id ON public.coupons (event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_event_ids ON public.coupons USING GIN (event_ids);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons (is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_coupon_id ON public.bookings (coupon_id);

-- 4. Trigger for automatic updated_at handling
DROP TRIGGER IF EXISTS handle_updated_at_coupons ON public.coupons;
CREATE TRIGGER handle_updated_at_coupons
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated users to query active coupons for checkout validation
DROP POLICY IF EXISTS "Public can view active valid coupons" ON public.coupons;
CREATE POLICY "Public can view active valid coupons" ON public.coupons
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses)
  );

-- Allow admins / editors full management over coupons
DROP POLICY IF EXISTS "Admins have full access to coupons" ON public.coupons;
CREATE POLICY "Admins have full access to coupons" ON public.coupons
  FOR ALL
  USING (
    public.is_editor_or_admin()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_editor_or_admin()
    OR auth.role() = 'service_role'
  );

-- 6. Helper function to atomically increment coupon usage upon booking payment confirmation
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
