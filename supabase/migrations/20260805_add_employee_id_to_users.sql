-- 20260805_add_employee_id_to_users.sql
-- Add employee_id column to users table for employee ID verification flow

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Index for fast lookup by employee_id
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
