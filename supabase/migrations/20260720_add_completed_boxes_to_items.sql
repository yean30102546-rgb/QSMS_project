-- Add completed_boxes column to rework_items table if it doesn't exist
ALTER TABLE rework_items
ADD COLUMN IF NOT EXISTS completed_boxes numeric DEFAULT 0;

-- Optional: Add a comment describing the column
COMMENT ON COLUMN rework_items.completed_boxes IS 'Tracks the number of completed boxes for this specific item';
