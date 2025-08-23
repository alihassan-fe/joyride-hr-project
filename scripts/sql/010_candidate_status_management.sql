-- Migration for candidate status management
-- This allows admins to create custom statuses beyond the default ones

-- Create candidate_statuses table
CREATE TABLE IF NOT EXISTS candidate_statuses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280', -- Default gray color
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default statuses
INSERT INTO candidate_statuses (name, color, is_default, sort_order) VALUES
  ('Call Immediately', '#10B981', TRUE, 1),
  ('Shortlist', '#3B82F6', TRUE, 2),
  ('Remove', '#EF4444', TRUE, 3),
  ('Applied', '#6B7280', FALSE, 4),
  ('Interview', '#F59E0B', FALSE, 5),
  ('Follow-up', '#8B5CF6', FALSE, 6),
  ('Offer', '#059669', FALSE, 7),
  ('Hired', '#047857', FALSE, 8),
  ('Rejected', '#DC2626', FALSE, 9),
  ('Quit', '#7C3AED', FALSE, 10)
ON CONFLICT (name) DO NOTHING;

-- Add status_id column to candidates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'status_id') THEN
    ALTER TABLE candidates ADD COLUMN status_id INTEGER REFERENCES candidate_statuses(id);
  END IF;
END $$;

-- Update existing candidates to use the default status based on their recommendation
UPDATE candidates 
SET status_id = (
  SELECT id FROM candidate_statuses 
  WHERE name = CASE 
    WHEN candidates.recommendation = 'Call Immediatley' THEN 'Call Immediately'
    WHEN candidates.recommendation = 'Shortlist' THEN 'Shortlist'
    WHEN candidates.recommendation = 'Remove' THEN 'Remove'
    ELSE 'Shortlist' -- Default fallback
  END
  LIMIT 1
)
WHERE status_id IS NULL;

-- Make status_id NOT NULL after setting default values
ALTER TABLE candidates ALTER COLUMN status_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_status_id ON candidates(status_id);
CREATE INDEX IF NOT EXISTS idx_candidate_statuses_sort_order ON candidate_statuses(sort_order);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidate_statuses_updated_at 
    BEFORE UPDATE ON candidate_statuses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
