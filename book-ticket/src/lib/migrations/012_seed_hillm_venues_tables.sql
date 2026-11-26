-- ============================================================
-- Khaleeji Tour — Seed Tables Data for Hillm Venues Map
-- ============================================================

-- 1. Create or ensure Hillm Venues seat map exists
INSERT INTO public.seat_maps (name, slug, venue_name, is_active)
VALUES ('Hillm Venues', 'hillm-venues', 'Hillm Premium Café & Banquet', true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, venue_name = EXCLUDED.venue_name;

-- 2. Insert/Upsert Hillm Venues Tables
DO $$
DECLARE
  v_map_id UUID;
BEGIN
  SELECT id INTO v_map_id FROM public.seat_maps WHERE slug = 'hillm-venues' LIMIT 1;

  IF v_map_id IS NOT NULL THEN
    -- Delete existing tables for clean seed
    DELETE FROM public.tables WHERE seat_map_id = v_map_id;

    -- VIP Rooms (Red, 12 PP, $125.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, 'VIP 1', 'vip_room_1', 'vip_room', 12, 125.00, 'available', 235.00, 510.00),
    (v_map_id, 'VIP 2', 'vip_room_2', 'vip_room', 12, 125.00, 'available', 965.00, 510.00);

    -- VIP Premium (Yellow, $110.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#1', 't_1', 'vip_premium', 12, 110.00, 'available', 390.00, 55.00),
    (v_map_id, '#19', 't_19', 'vip_premium', 12, 110.00, 'available', 810.00, 55.00),
    (v_map_id, '#7', 't_7', 'vip_premium', 16, 110.00, 'available', 380.00, 200.00),
    (v_map_id, '#13', 't_13', 'vip_premium', 16, 110.00, 'available', 820.00, 200.00),
    (v_map_id, '#8', 't_8', 'vip_premium', 12, 110.00, 'available', 430.00, 350.00),
    (v_map_id, '#12', 't_12', 'vip_premium', 12, 110.00, 'available', 770.00, 350.00),
    (v_map_id, '#9', 't_9', 'vip_premium', 10, 110.00, 'available', 540.00, 375.00),
    (v_map_id, '#10', 't_10', 'vip_premium', 10, 110.00, 'available', 600.00, 375.00),
    (v_map_id, '#11', 't_11', 'vip_premium', 10, 110.00, 'available', 660.00, 375.00),
    (v_map_id, '#20', 't_20', 'vip_premium', 8, 110.00, 'available', 445.00, 485.00),
    (v_map_id, '#21', 't_21', 'vip_premium', 10, 110.00, 'available', 555.00, 490.00),
    (v_map_id, '#22', 't_22', 'vip_premium', 10, 110.00, 'available', 645.00, 490.00),
    (v_map_id, '#23', 't_23', 'vip_premium', 8, 110.00, 'available', 755.00, 485.00);

    -- VIP Standard (Green, $100.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#2', 't_2', 'vip_standard', 8, 100.00, 'available', 275.00, 80.00),
    (v_map_id, '#6', 't_6', 'vip_standard', 12, 100.00, 'available', 235.00, 180.00),
    (v_map_id, '#18', 't_18', 'vip_standard', 8, 100.00, 'available', 925.00, 80.00),
    (v_map_id, '#14', 't_14', 'vip_standard', 12, 100.00, 'available', 965.00, 180.00);

    -- General (Grey, $90.00)
    INSERT INTO public.tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status, position_x, position_y) VALUES
    (v_map_id, '#3', 't_3', 'general', 8, 90.00, 'available', 170.00, 120.00),
    (v_map_id, '#4', 't_4', 'general', 12, 90.00, 'available', 65.00, 160.00),
    (v_map_id, '#5', 't_5', 'general', 12, 90.00, 'available', 125.00, 220.00),
    (v_map_id, '#17', 't_17', 'general', 8, 90.00, 'available', 1030.00, 120.00),
    (v_map_id, '#16', 't_16', 'general', 12, 90.00, 'available', 1135.00, 160.00),
    (v_map_id, '#15', 't_15', 'general', 12, 90.00, 'available', 1075.00, 220.00),
    (v_map_id, '#28', 't_28', 'general', 8, 90.00, 'available', 445.00, 575.00),
    (v_map_id, '#29', 't_29', 'general', 8, 90.00, 'available', 445.00, 665.00),
    (v_map_id, '#27', 't_27', 'general', 10, 90.00, 'available', 555.00, 595.00),
    (v_map_id, '#26', 't_26', 'general', 10, 90.00, 'available', 645.00, 595.00),
    (v_map_id, '#24', 't_24', 'general', 8, 90.00, 'available', 755.00, 575.00),
    (v_map_id, '#25', 't_25', 'general', 8, 90.00, 'available', 755.00, 665.00);
  END IF;
END $$;
