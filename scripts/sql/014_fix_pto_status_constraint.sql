-- Fix PTO status constraint to include 'cancelled' status
-- This migration updates the check constraint on pto_requests.status to allow 'cancelled' status

-- Drop the existing constraint
ALTER TABLE pto_requests DROP CONSTRAINT IF EXISTS pto_requests_status_check;

-- Add the new constraint with 'cancelled' included
ALTER TABLE pto_requests ADD CONSTRAINT pto_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Verify the constraint was added correctly
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'pto_requests'::regclass AND conname = 'pto_requests_status_check';
