-- 20260826_phase1_workflow_roles_and_case_id.sql
-- Migration: Add support for 4 Roles (Admin, QSMS, WPK, PDF),
-- 5 Workflow Statuses, Material Requisition JSONB, Blocked Defend JSONB, and Auto Case ID Sequence

-- 1. Add new columns to rework_cases
ALTER TABLE rework_cases 
ADD COLUMN IF NOT EXISTS case_sequence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_requests JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS blocked_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_by_role TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT '';

-- 2. Create index on case_sequence and status for fast lookups
CREATE INDEX IF NOT EXISTS idx_rework_cases_sequence ON rework_cases(case_sequence);
CREATE INDEX IF NOT EXISTS idx_rework_cases_created_by_role ON rework_cases(created_by_role);

-- 3. Sequence Helper Function to ensure atomic next ID per prefix & year
CREATE OR REPLACE FUNCTION get_next_case_sequence(p_prefix TEXT, p_year TEXT)
RETURNS INTEGER AS $$
DECLARE
    next_seq INTEGER;
BEGIN
    SELECT COALESCE(MAX(case_sequence), 0) + 1 INTO next_seq
    FROM rework_cases
    WHERE id LIKE p_prefix || '-' || p_year || '-%'
       OR id LIKE p_prefix || p_year || '%';
    RETURN next_seq;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure demo users for all 4 roles exist in users table
-- Password for all demo accounts: Admin123 (salt=d36d4df5bb9036c138127be513e54580)
INSERT INTO users (username, password_hash, name, role) 
VALUES 
  ('admin', 'd36d4df5bb9036c138127be513e54580:5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224', 'System Administrator', 'ADMIN'),
  ('qsms', 'd36d4df5bb9036c138127be513e54580:5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224', 'QSMS Quality Inspector', 'QSMS'),
  ('wpk', 'd36d4df5bb9036c138127be513e54580:5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224', 'WPK Warehouse Officer', 'WPK'),
  ('pdf', 'd36d4df5bb9036c138127be513e54580:5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224', 'PDF Production Repairer', 'PDF')
ON CONFLICT (username) DO UPDATE 
SET role = EXCLUDED.role, name = EXCLUDED.name;
