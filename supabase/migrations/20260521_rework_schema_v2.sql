-- Rework Cases Table
CREATE TABLE IF NOT EXISTS rework_cases (
    id TEXT PRIMARY KEY, -- Custom RW... format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submission_date TEXT NOT NULL, -- The 'date' field from frontend
    source TEXT NOT NULL, -- 'SFC' or 'Customer'
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    profile_id TEXT NOT NULL,
    image_folder_url TEXT,
    or_folder_url TEXT,
    or_files_urls JSONB DEFAULT '[]', -- Array of Drive URLs
    batch_no TEXT,
    packaging_date TEXT,
    mold TEXT,
    total_rework_cost DECIMAL(12, 2) DEFAULT 0,
    resolution_method TEXT,
    labor_count INTEGER DEFAULT 0,
    labor_hours DECIMAL(8, 2) DEFAULT 0,
    labor_rate DECIMAL(10, 2) DEFAULT 0,
    materials JSONB DEFAULT '[]', -- Array of MaterialUsage objects
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Rework Items Table
CREATE TABLE IF NOT EXISTS rework_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT NOT NULL REFERENCES rework_cases(id) ON DELETE CASCADE,
    item_number TEXT NOT NULL,
    item_code TEXT,
    item_name TEXT,
    amount DECIMAL(12, 2) DEFAULT 0, -- Qty of the item
    reason TEXT, -- Main reason (Leak, Stain, etc.)
    reason_subtype TEXT,
    responsible TEXT,
    responsible_subtype TEXT,
    details TEXT, -- Additional remarks
    line TEXT, -- Production line
    image_urls JSONB DEFAULT '[]', -- Direct Drive URLs
    image_folder_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rework Master Data
CREATE TABLE IF NOT EXISTS rework_master_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_number TEXT UNIQUE NOT NULL,
    item_code TEXT,
    item_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rework_master_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_code TEXT UNIQUE NOT NULL,
    defect_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rework_items_case_id ON rework_items(case_id);
CREATE INDEX IF NOT EXISTS idx_rework_cases_status ON rework_cases(status);
CREATE INDEX IF NOT EXISTS idx_rework_cases_created ON rework_cases(created_at DESC);
