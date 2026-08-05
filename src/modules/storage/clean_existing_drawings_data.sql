-- ==========================================
-- QSMS Engineering Drawings Data Cleanup & Constraints Migration
-- Run this script in the Supabase SQL Editor to clean 237 existing rows 100%
-- ==========================================

BEGIN;

-- 1. Standardize customer_name
UPDATE engineering_drawings
SET customer_name = 'ENEOS'
WHERE LOWER(TRIM(customer_name)) LIKE '%eneos%'
   OR LOWER(TRIM(customer_name)) LIKE '%honda%'
   OR LOWER(TRIM(customer_name)) LIKE '%suzuki%'
   OR LOWER(TRIM(customer_name)) LIKE '%yamalube%';

UPDATE engineering_drawings
SET customer_name = 'PTTOR'
WHERE LOWER(TRIM(customer_name)) = 'or'
   OR LOWER(TRIM(customer_name)) LIKE '%ptt%';

UPDATE engineering_drawings
SET customer_name = 'PETRONAS'
WHERE LOWER(TRIM(customer_name)) LIKE '%petronas%';

UPDATE engineering_drawings
SET customer_name = 'VALVOLINE'
WHERE LOWER(TRIM(customer_name)) LIKE '%valvoline%';

UPDATE engineering_drawings
SET customer_name = 'BCP'
WHERE LOWER(TRIM(customer_name)) LIKE '%bcp%'
   OR LOWER(TRIM(customer_name)) LIKE '%bangchak%';

-- 2. Standardize pallet_type
UPDATE engineering_drawings
SET pallet_type = 'พลาสติก'
WHERE LOWER(TRIM(pallet_type)) LIKE '%พลาสติก%'
   OR LOWER(TRIM(pallet_type)) LIKE '%plastic%';

UPDATE engineering_drawings
SET pallet_type = 'ไม้'
WHERE LOWER(TRIM(pallet_type)) LIKE '%ไม้%'
   OR LOWER(TRIM(pallet_type)) LIKE '%wood%';

UPDATE engineering_drawings
SET pallet_type = 'CHEP'
WHERE LOWER(TRIM(pallet_type)) LIKE '%chep%';

UPDATE engineering_drawings
SET pallet_type = 'กระดาษ'
WHERE LOWER(TRIM(pallet_type)) LIKE '%กระดาษ%'
   OR LOWER(TRIM(pallet_type)) LIKE '%paper%';

UPDATE engineering_drawings
SET pallet_type = NULL
WHERE pallet_type IS NOT NULL
  AND pallet_type NOT IN ('ไม้', 'พลาสติก', 'กระดาษ', 'CHEP');

-- 3. Standardize boxes_per_pallet (Keep digits only, clear text like 'ตามความเหมาะสม')
UPDATE engineering_drawings
SET boxes_per_pallet = REGEXP_REPLACE(boxes_per_pallet, '[^0-9]', '', 'g')
WHERE boxes_per_pallet IS NOT NULL;

UPDATE engineering_drawings
SET boxes_per_pallet = NULL
WHERE boxes_per_pallet = '' OR boxes_per_pallet = 'null';

-- 4. Standardize oil_group
UPDATE engineering_drawings
SET oil_group = 'ENGINE OIL'
WHERE LOWER(TRIM(oil_group)) LIKE '%engine%'
   OR LOWER(TRIM(oil_group)) LIKE '%motor%'
   OR LOWER(TRIM(oil_group)) LIKE '%diesel%'
   OR LOWER(TRIM(oil_group)) LIKE '%gasoline%'
   OR LOWER(TRIM(oil_group)) LIKE '%เบนซิน%'
   OR LOWER(TRIM(oil_group)) LIKE '%ดีเซล%'
   OR LOWER(TRIM(oil_group)) LIKE '%เครื่องยนต์%';

UPDATE engineering_drawings
SET oil_group = 'GEAR OIL'
WHERE LOWER(TRIM(oil_group)) LIKE '%gear%'
   OR LOWER(TRIM(oil_group)) LIKE '%เกียร์%';

UPDATE engineering_drawings
SET oil_group = NULL
WHERE oil_group IS NOT NULL
  AND oil_group NOT IN ('ENGINE OIL', 'GEAR OIL');

-- 6. Standardize shelf_life
UPDATE engineering_drawings
SET shelf_life = NULL
WHERE LOWER(TRIM(shelf_life)) = 'null' 
   OR TRIM(shelf_life) = '';

UPDATE engineering_drawings
SET shelf_life = '2 years'
WHERE LOWER(TRIM(shelf_life)) = '24 months';

UPDATE engineering_drawings
SET shelf_life = '4 years'
WHERE LOWER(TRIM(shelf_life)) = '48 months';

UPDATE engineering_drawings
SET shelf_life = REGEXP_REPLACE(shelf_life, '[^0-9]', '', 'g') || ' years'
WHERE shelf_life IS NOT NULL 
  AND shelf_life NOT LIKE '%years%' 
  AND (shelf_life LIKE '%ปี%' OR shelf_life LIKE '%EXP.%');

-- 7. Add DB Check Constraints to prevent future junk data
ALTER TABLE engineering_drawings DROP CONSTRAINT IF EXISTS check_oil_group;
ALTER TABLE engineering_drawings ADD CONSTRAINT check_oil_group 
  CHECK (oil_group IS NULL OR oil_group IN ('ENGINE OIL', 'GEAR OIL'));

ALTER TABLE engineering_drawings DROP CONSTRAINT IF EXISTS check_pallet_type;
ALTER TABLE engineering_drawings ADD CONSTRAINT check_pallet_type 
  CHECK (pallet_type IS NULL OR pallet_type IN ('ไม้', 'พลาสติก', 'กระดาษ', 'CHEP'));

ALTER TABLE engineering_drawings DROP CONSTRAINT IF EXISTS check_customer_name;
ALTER TABLE engineering_drawings ADD CONSTRAINT check_customer_name 
  CHECK (customer_name IS NULL OR customer_name IN ('ENEOS', 'PTTOR', 'PETRONAS', 'VALVOLINE', 'BCP'));

ALTER TABLE engineering_drawings DROP CONSTRAINT IF EXISTS check_shelf_life;
ALTER TABLE engineering_drawings ADD CONSTRAINT check_shelf_life
  CHECK (shelf_life IS NULL OR shelf_life ~ '^[0-9]+ years$');

COMMIT;
