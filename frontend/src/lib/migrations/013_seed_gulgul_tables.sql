-- ============================================================
-- Khaleeji Tour — Seed Tables Data for Gul Gul Map
-- ============================================================

-- 1. Ensure category check constraint supports all semantic categories
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_category_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_category_check 
CHECK (category IN ('vip', 'gold', 'silver', 'standard', 'vip_room', 'vip_premium', 'vip_standard', 'general'));

-- 2. Insert or update Gul Gul seat map
INSERT INTO public.seat_maps (name, slug, venue_name, preview_image_url, is_active)
VALUES ('Gul Gul', 'gul-gul', 'Gul Gul Stage & Venue', '/seat-maps/map - GUL GUL.webp', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, venue_name = EXCLUDED.venue_name, preview_image_url = EXCLUDED.preview_image_url;

-- 3. Insert/Upsert Gul Gul Tables (18 Tables)
DO $$
DECLARE
  v_map_id UUID;
BEGIN
  SELECT id INTO v_map_id FROM public.seat_maps WHERE slug = 'gul-gul' LIMIT 1;

  IF v_map_id IS NOT NULL THEN
    -- Delete existing tables for clean seed
    DELETE FROM public.tables WHERE seat_map_id = v_map_id;

    -- VIP Premium (Yellow, $75.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#1', 't_1', 'vip_premium', 4, 75.00, 'available', 95.00, 240.00),
    (v_map_id, '#2', 't_2', 'vip_premium', 10, 75.00, 'available', 215.00, 275.00),
    (v_map_id, '#3', 't_3', 'vip_premium', 10, 75.00, 'available', 305.00, 275.00),
    (v_map_id, '#4', 't_4', 'vip_premium', 10, 75.00, 'available', 395.00, 275.00),
    (v_map_id, '#5', 't_5', 'vip_premium', 12, 75.00, 'available', 95.00, 430.00),
    (v_map_id, '#6', 't_6', 'vip_premium', 5, 75.00, 'available', 505.00, 290.00);

    -- VIP Standard (Green, $65.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#7', 't_7', 'vip_standard', 5, 65.00, 'available', 505.00, 410.00),
    (v_map_id, '#8', 't_8', 'vip_standard', 4, 65.00, 'available', 385.00, 445.00),
    (v_map_id, '#9', 't_9', 'vip_standard', 8, 65.00, 'available', 105.00, 625.00),
    (v_map_id, '#10', 't_10', 'vip_standard', 10, 65.00, 'available', 215.00, 600.00),
    (v_map_id, '#11', 't_11', 'vip_standard', 10, 65.00, 'available', 305.00, 600.00),
    (v_map_id, '#12', 't_12', 'vip_standard', 10, 65.00, 'available', 395.00, 600.00);

    -- General (Grey, $55.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#13', 't_13', 'general', 12, 55.00, 'available', 510.00, 565.00),
    (v_map_id, '#14', 't_14', 'general', 5, 55.00, 'available', 510.00, 720.00),
    (v_map_id, '#15', 't_15', 'general', 5, 55.00, 'available', 510.00, 830.00),
    (v_map_id, '#18', 't_18', 'general', 10, 55.00, 'available', 215.00, 825.00),
    (v_map_id, '#17', 't_17', 'general', 10, 55.00, 'available', 305.00, 825.00),
    (v_map_id, '#16', 't_16', 'general', 10, 55.00, 'available', 395.00, 825.00);
  END IF;
END $$;
