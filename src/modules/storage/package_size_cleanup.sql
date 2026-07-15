-- ==========================================
-- QSMS Package Size Standardization Cleanup
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Standardize Small Packs (<= 200L) with typical variations
-- 1L Variations -> '1 x 24 L.'
UPDATE drawings 
SET package_size = '1 x 24 L.' 
WHERE LOWER(TRIM(package_size)) IN ('1l', '1 l', '1 liter', '1 litre', '1l x 24', '1 l x 24', '1 x 24', '1 x 24l', '1l*24', '1x24');

-- 4L Variations -> '4 x 6 L.'
UPDATE drawings 
SET package_size = '4 x 6 L.' 
WHERE LOWER(TRIM(package_size)) IN ('4l', '4 l', '4 liter', '4 litre', '4l x 6', '4 l x 6', '4 x 6', '4 x 6l', '4l*6', '4x6');

-- 5L Variations -> '5 x 4 L.'
UPDATE drawings 
SET package_size = '5 x 4 L.' 
WHERE LOWER(TRIM(package_size)) IN ('5l', '5 l', '5 liter', '5 liters', '5l x 4', '5 l x 4', '5 x 4', '5 x 4l', '5l*4', '5x4');

-- 18L Variations -> '18 x 1 L.'
UPDATE drawings 
SET package_size = '18 x 1 L.' 
WHERE LOWER(TRIM(package_size)) IN ('18l', '18 l', '18 liter', '18kg', '18 kg', '18 x 1', '18 x 1 l.', '18l x 1');

-- 20L Variations -> '20 x 1 L.'
UPDATE drawings 
SET package_size = '20 x 1 L.' 
WHERE LOWER(TRIM(package_size)) IN ('20l', '20 l', '20 liter', '20kg', '20 kg', '20 x 1', '20 x 1 l.', '20l x 1');


-- 2. Standardize Small Packs with Free Gifts
-- 4 x 6 + 1 L. Variations
UPDATE drawings 
SET package_size = '4 x 6 + 1 L.' 
WHERE LOWER(TRIM(package_size)) IN ('4x6+1', '4 x 6 + 1', '4l x 6 + 1l', '4 x 6 + 1 l', '4*6+1', '4x6+1 l.');

-- 4 x 6 + 0.5 L. Variations
UPDATE drawings 
SET package_size = '4 x 6 + 0.5 L.' 
WHERE LOWER(TRIM(package_size)) IN ('4x6+0.5', '4 x 6 + 0.5', '4l x 6 + 0.5l', '4 x 6 + 0.5 l', '4*6+0.5', '4x6+0.5 l.');


-- 3. Standardize Pail / Drum (200L to 999L)
-- 200L Variations -> '200 L.'
UPDATE drawings 
SET package_size = '200 L.' 
WHERE LOWER(TRIM(package_size)) IN ('200l', '200 l', '200 liter', '200 liters', '200l.', '200 l.');


-- 4. Standardize IBC (>= 1000L)
-- 1000L Variations -> '1000 L.'
UPDATE drawings 
SET package_size = '1000 L.' 
WHERE LOWER(TRIM(package_size)) IN ('1000l', '1000 l', '1000 liter', '1000l.', '1000 l.', '1000liters');
