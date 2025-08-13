-- Add department column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add some sample departments if needed
-- UPDATE candidates SET department = 'Engineering' WHERE id IN (1, 2);
-- UPDATE candidates SET department = 'Marketing' WHERE id IN (3, 4);
-- UPDATE candidates SET department = 'Operations' WHERE id IN (5, 6);
