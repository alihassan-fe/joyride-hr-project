-- Fix Foreign Key Constraints for Activity Logging
-- This file fixes the foreign key constraints to reference the users table instead of employees table

-- 1. Drop existing foreign key constraints
ALTER TABLE employee_notes DROP CONSTRAINT IF EXISTS employee_notes_created_by_fkey;
ALTER TABLE employee_kpis DROP CONSTRAINT IF EXISTS employee_kpis_created_by_fkey;
ALTER TABLE employee_performance DROP CONSTRAINT IF EXISTS employee_performance_created_by_fkey;
ALTER TABLE employee_documents DROP CONSTRAINT IF EXISTS employee_documents_uploaded_by_fkey;
ALTER TABLE employee_meetings DROP CONSTRAINT IF EXISTS employee_meetings_created_by_fkey;
ALTER TABLE employee_kpi_scores DROP CONSTRAINT IF EXISTS employee_kpi_scores_created_by_fkey;

-- 2. Add new foreign key constraints that reference the users table
ALTER TABLE employee_notes ADD CONSTRAINT employee_notes_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employee_kpis ADD CONSTRAINT employee_kpis_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employee_performance ADD CONSTRAINT employee_performance_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employee_documents ADD CONSTRAINT employee_documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employee_meetings ADD CONSTRAINT employee_meetings_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE employee_kpi_scores ADD CONSTRAINT employee_kpi_scores_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Also fix the employee_activity_log table to reference users instead of employees for actor_id
ALTER TABLE employee_activity_log DROP CONSTRAINT IF EXISTS employee_activity_log_actor_id_fkey;
ALTER TABLE employee_activity_log ADD CONSTRAINT employee_activity_log_actor_id_fkey 
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Update the trigger functions to use the correct table references
-- Note: The triggers will now work correctly since they reference the users table

-- Add comment to document the changes
COMMENT ON CONSTRAINT employee_notes_created_by_fkey ON employee_notes IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_kpis_created_by_fkey ON employee_kpis IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_performance_created_by_fkey ON employee_performance IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_documents_uploaded_by_fkey ON employee_documents IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_meetings_created_by_fkey ON employee_meetings IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_kpi_scores_created_by_fkey ON employee_kpi_scores IS 'References users table for activity tracking';
COMMENT ON CONSTRAINT employee_activity_log_actor_id_fkey ON employee_activity_log IS 'References users table for activity tracking';
