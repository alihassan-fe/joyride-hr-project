-- Add JSON field for department-specific data
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS department_specific_data JSONB DEFAULT '{}';

-- Add department column if not exists
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Operations';

-- Add address column if not exists  
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for better JSON queries
CREATE INDEX IF NOT EXISTS idx_candidates_department_data ON candidates USING GIN (department_specific_data);
CREATE INDEX IF NOT EXISTS idx_candidates_department ON candidates(department);
