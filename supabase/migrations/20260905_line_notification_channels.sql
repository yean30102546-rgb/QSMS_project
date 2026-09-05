-- 20260905_line_notification_channels.sql
-- Migration: Create channels and logs table for LINE Messaging API integration

-- 1. Create table for registered LINE groups/channels
CREATE TABLE IF NOT EXISTS line_notification_channels (
  channel_key VARCHAR(50) PRIMARY KEY,
  group_id VARCHAR(64) NOT NULL,
  group_name TEXT DEFAULT '',
  registered_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by group_id
CREATE INDEX IF NOT EXISTS idx_line_channels_group_id ON line_notification_channels(group_id);

-- 2. Create notification audit log table
CREATE TABLE IF NOT EXISTS line_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT,
  channel_key VARCHAR(50),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB,
  status VARCHAR(20) DEFAULT 'SUCCESS',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_logs_case_id ON line_notification_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_line_logs_sent_at ON line_notification_logs(sent_at DESC);

-- 3. Add line_user_id to profiles for future individual user notifications
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(64);
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_display_name TEXT;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
