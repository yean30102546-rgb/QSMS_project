-- 20260904_phase3_production_hardening.sql
-- Migration: Add missing production columns and composite indexes for enterprise stability

-- 1. Ensure all blocker and missing material columns exist on rework_cases
ALTER TABLE rework_cases 
ADD COLUMN IF NOT EXISTS missing_boxes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_gallons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missing_oil NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolution_method TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Add high-performance composite indexes
CREATE INDEX IF NOT EXISTS idx_rework_cases_status_deleted ON rework_cases(status, is_deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rework_items_case_id ON rework_items(case_id);
CREATE INDEX IF NOT EXISTS idx_master_items_lookup ON rework_master_items(item_number, item_code);

-- 3. Notify postgrest to reload schema cache
NOTIFY pgrst, 'reload schema';
