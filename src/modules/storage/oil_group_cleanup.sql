-- ==========================================
-- QSMS Oil Group Standardization Cleanup
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Standardize ENGINE OIL
UPDATE engineering_drawings 
SET oil_group = 'ENGINE OIL' 
WHERE LOWER(TRIM(oil_group)) LIKE '%engine%'
   OR LOWER(TRIM(oil_group)) LIKE '%motor%'
   OR LOWER(TRIM(oil_group)) LIKE '%diesel%'
   OR LOWER(TRIM(oil_group)) LIKE '%gasoline%'
   OR LOWER(TRIM(oil_group)) LIKE '%เบนซิน%'
   OR LOWER(TRIM(oil_group)) LIKE '%ดีเซล%'
   OR LOWER(TRIM(oil_group)) LIKE '%เครื่องยนต์%';

-- 2. Standardize GEAR OIL
UPDATE engineering_drawings 
SET oil_group = 'GEAR OIL' 
WHERE LOWER(TRIM(oil_group)) LIKE '%gear%'
   OR LOWER(TRIM(oil_group)) LIKE '%เกียร์%';

-- 3. Clear out everything else (ATF, COOLANT, Viscosity grades like 5W-30, etc.)
-- Since the requirement is strictly ENGINE OIL and GEAR OIL, anything else will be set to NULL
UPDATE engineering_drawings 
SET oil_group = NULL 
WHERE oil_group IS NOT NULL 
  AND oil_group NOT IN ('ENGINE OIL', 'GEAR OIL');
