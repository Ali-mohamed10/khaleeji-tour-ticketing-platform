-- Migration 014: Fix Hillm Venues seat map and separate from Gul Gul
-- 1. Rename the original seat map from gulgul-windsor to hillm-venues
-- 2. Delete old mismatched tables (B1-B6, G1-G6, T1-T6)
-- 3. Re-seed the 31 correct Hillm tables (#1-#29, VIP 1, VIP 2)
-- 4. Bind The Titan Edition event to Hillm Venues
-- 5. Bind second event to Gul Gul seat map

-- Step 1: Rename seat map
UPDATE seat_maps
SET name = 'Hillm Venues', slug = 'hillm-venues'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Step 2: Delete old tables
DELETE FROM tables WHERE seat_map_id = '11111111-1111-1111-1111-111111111111';

-- Step 3: Insert 31 Hillm Venues tables
INSERT INTO tables (seat_map_id, table_code, svg_element_id, category, capacity, price, status) VALUES
-- Top Row (VIP Premium, $75)
('11111111-1111-1111-1111-111111111111', '#1',  'table-1',  'vip_premium', 12, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#19', 'table-19', 'vip_premium', 12, 75.00, 'available'),
-- Left Wing Top Angled
('11111111-1111-1111-1111-111111111111', '#2',  'table-2',  'vip_standard', 8,  65.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#3',  'table-3',  'general',      8,  55.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#4',  'table-4',  'general',      12, 55.00, 'available'),
-- Left Wing Bottom Angled
('11111111-1111-1111-1111-111111111111', '#6',  'table-6',  'vip_standard', 12, 65.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#5',  'table-5',  'general',      12, 55.00, 'available'),
-- Right Wing Top Angled
('11111111-1111-1111-1111-111111111111', '#18', 'table-18', 'vip_standard', 8,  65.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#17', 'table-17', 'general',      8,  55.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#16', 'table-16', 'general',      12, 55.00, 'available'),
-- Right Wing Bottom Angled
('11111111-1111-1111-1111-111111111111', '#14', 'table-14', 'vip_standard', 12, 65.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#15', 'table-15', 'general',      12, 55.00, 'available'),
-- Dance Floor Side Tables
('11111111-1111-1111-1111-111111111111', '#7',  'table-7',  'vip_premium',  16, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#13', 'table-13', 'vip_premium',  16, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#8',  'table-8',  'vip_premium',  12, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#12', 'table-12', 'vip_premium',  12, 75.00, 'available'),
-- Center Sub-Dance Floor Tables
('11111111-1111-1111-1111-111111111111', '#9',  'table-9',  'vip_premium',  10, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#10', 'table-10', 'vip_premium',  10, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#11', 'table-11', 'vip_premium',  10, 75.00, 'available'),
-- Bottom Aisle Left Column
('11111111-1111-1111-1111-111111111111', '#20', 'table-20', 'vip_premium',  8,  75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#28', 'table-28', 'general',      8,  55.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#29', 'table-29', 'general',      8,  55.00, 'available'),
-- Bottom Center-Left Column
('11111111-1111-1111-1111-111111111111', '#21', 'table-21', 'vip_premium',  10, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#27', 'table-27', 'general',      10, 55.00, 'available'),
-- Bottom Center-Right Column
('11111111-1111-1111-1111-111111111111', '#22', 'table-22', 'vip_premium',  10, 75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#26', 'table-26', 'general',      10, 55.00, 'available'),
-- Bottom Right Column
('11111111-1111-1111-1111-111111111111', '#23', 'table-23', 'vip_premium',  8,  75.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#24', 'table-24', 'general',      8,  55.00, 'available'),
('11111111-1111-1111-1111-111111111111', '#25', 'table-25', 'general',      8,  55.00, 'available'),
-- VIP Rooms
('11111111-1111-1111-1111-111111111111', 'VIP 1', 'table-vip1', 'vip_room', 12, 125.00, 'available'),
('11111111-1111-1111-1111-111111111111', 'VIP 2', 'table-vip2', 'vip_room', 12, 125.00, 'available');

-- Step 4: Bind second event (the-titan-edition-2) to Gul Gul seat map
UPDATE events
SET seat_map_id = 'c42664ff-d1ab-4c9b-8a35-421a8976e879'
WHERE id = '9c8223e4-6d24-4929-b3f0-87e16fa1e262';
