-- 20260702_create_users_table.sql
-- Create users table for tracking who performs what actions

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup during login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert an initial admin user just in case
-- The password is "Admin123" (salt=d36d4df5bb9036c138127be513e54580, hash=5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224)
INSERT INTO users (username, password_hash, name, role) 
VALUES ('admin', 'd36d4df5bb9036c138127be513e54580:5c3328ce3a00509a25b29fc12d7c58ed5d12ef4b792eef8e530062bcaf405523091fc5ad428614ba6cf8663806fb769229fc808603ed782160d7031da4d09224', 'System Admin', 'QSMS')
ON CONFLICT (username) DO NOTHING;
