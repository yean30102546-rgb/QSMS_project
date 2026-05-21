-- Rework Cases Table
CREATE TABLE IF NOT EXISTS rework_cases (
    id TEXT PRIMARY KEY, -- Using the custom RW... format from frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    profile_id TEXT NOT NULL, -- Who created the case
    image_folder_url TEXT, -- Link to Google Drive folder
    batch_no TEXT,
    packaging_date TEXT,
    mold TEXT,
    total_rework_cost DECIMAL(12, 2) DEFAULT 0,
    resolution_method TEXT,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Rework Items Table (Many-to-One with Case)
CREATE TABLE IF NOT EXISTS rework_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES rework_cases(id) ON DELETE CASCADE,
    item_number TEXT NOT NULL,
    item_code TEXT,
    item_name TEXT,
    defect_code TEXT,
    defect_name TEXT,
    qty_rework INTEGER DEFAULT 1,
    rework_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rework Audit Logs
CREATE TABLE IF NOT EXISTS rework_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES rework_cases(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rework_items_case_id ON rework_items(case_id);
CREATE INDEX IF NOT EXISTS idx_rework_cases_status ON rework_cases(status);
CREATE INDEX IF NOT EXISTS idx_rework_cases_created ON rework_cases(created_at DESC);
