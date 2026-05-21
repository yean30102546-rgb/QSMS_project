-- Roster Employees Table
CREATE TABLE IF NOT EXISTS roster_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phase SMALLINT NOT NULL CHECK (phase IN (0, 1)),
    start_working_saturday DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roster Overrides Table
CREATE TABLE IF NOT EXISTS roster_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES roster_employees(id) ON DELETE CASCADE,
    date_key TEXT NOT NULL, -- Format: YYYY-MM-DD
    status TEXT NOT NULL, -- 'WORK', 'OFF', 'OT2X', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_id, date_key)
);

-- Roster Leaves Table
CREATE TABLE IF NOT EXISTS roster_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES roster_employees(id) ON DELETE CASCADE,
    date_key TEXT NOT NULL, -- Format: YYYY-MM-DD
    leave_type TEXT NOT NULL, -- 'sick', 'business', etc.
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_id, date_key)
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_roster_overrides_date ON roster_overrides(date_key);
CREATE INDEX IF NOT EXISTS idx_roster_leaves_date ON roster_leaves(date_key);
CREATE INDEX IF NOT EXISTS idx_roster_employees_name ON roster_employees(name);
