-- Add missing columns to employees table that are used in triggers and API
-- The updated_by column is referenced in trigger functions but doesn't exist

ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);
