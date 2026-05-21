-- Migration V3: Add missing columns to rework_items and alter default timestamps to now()

-- 1. Alter rework_items to add missing columns
ALTER TABLE rework_items ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE rework_items ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE rework_items ADD COLUMN IF NOT EXISTS packaging_date TEXT;
ALTER TABLE rework_items ADD COLUMN IF NOT EXISTS mold TEXT;
ALTER TABLE rework_items ADD COLUMN IF NOT EXISTS uid TEXT;

-- 2. Alter default timestamps to use now() directly (timezone-aware)
ALTER TABLE rework_cases ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE rework_cases ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE rework_items ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE rework_logs ALTER COLUMN timestamp SET DEFAULT now();
