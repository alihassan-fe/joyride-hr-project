-- Activity Logging Triggers and Functions
-- This file adds automatic activity logging for employee-related actions

-- Create triggers for employee_activity_log table
-- These triggers will automatically log activities when data is inserted, updated, or deleted

-- 1. Trigger for employee profile updates
CREATE OR REPLACE FUNCTION log_employee_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[] := '{}';
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
BEGIN
    -- Only log if this is an update (not insert)
    IF TG_OP = 'UPDATE' THEN
        -- Check which fields have changed
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changed_fields := array_append(changed_fields, 'name');
        END IF;
        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changed_fields := array_append(changed_fields, 'email');
        END IF;
        IF OLD.department IS DISTINCT FROM NEW.department THEN
            changed_fields := array_append(changed_fields, 'department');
        END IF;
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            changed_fields := array_append(changed_fields, 'role');
        END IF;
        IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            changed_fields := array_append(changed_fields, 'phone');
        END IF;
        IF OLD.address IS DISTINCT FROM NEW.address THEN
            changed_fields := array_append(changed_fields, 'address');
        END IF;
        IF OLD.employment_status IS DISTINCT FROM NEW.employment_status THEN
            changed_fields := array_append(changed_fields, 'employment_status');
        END IF;
        IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
            changed_fields := array_append(changed_fields, 'manager_id');
        END IF;
        IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
            changed_fields := array_append(changed_fields, 'client_id');
        END IF;
        
        -- Only log if there are actual changes
        IF array_length(changed_fields, 1) > 0 THEN
            INSERT INTO employee_activity_log (
                employee_id, actor_id, action_type, action_details
            ) VALUES (
                NEW.id, 
                COALESCE(NEW.updated_by, NEW.id), -- Use updated_by if available, otherwise use employee's own ID
                'profile_updated',
                jsonb_build_object(
                    'changed_fields', changed_fields,
                    'previous_values', jsonb_build_object(
                        'name', OLD.name,
                        'email', OLD.email,
                        'department', OLD.department,
                        'role', OLD.role,
                        'phone', OLD.phone,
                        'address', OLD.address,
                        'employment_status', OLD.employment_status,
                        'manager_id', OLD.manager_id,
                        'client_id', OLD.client_id
                    ),
                    'new_values', jsonb_build_object(
                        'name', NEW.name,
                        'email', NEW.email,
                        'department', NEW.department,
                        'role', NEW.role,
                        'phone', NEW.phone,
                        'address', NEW.address,
                        'employment_status', NEW.employment_status,
                        'manager_id', NEW.manager_id,
                        'client_id', NEW.client_id
                    )
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee profile changes
DROP TRIGGER IF EXISTS trigger_log_employee_profile_changes ON employees;
CREATE TRIGGER trigger_log_employee_profile_changes
    AFTER UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_profile_changes();

-- 2. Trigger for employee document uploads
CREATE OR REPLACE FUNCTION log_employee_document_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.uploaded_by,
            'document_uploaded',
            jsonb_build_object(
                'document_name', NEW.file_name,
                'document_type', NEW.document_type,
                'file_size', NEW.file_size,
                'category_id', NEW.category_id
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            OLD.employee_id,
            COALESCE(OLD.uploaded_by, OLD.employee_id),
            'document_deleted',
            jsonb_build_object(
                'document_name', OLD.file_name,
                'document_type', OLD.document_type,
                'file_size', OLD.file_size,
                'category_id', OLD.category_id
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee document changes
DROP TRIGGER IF EXISTS trigger_log_employee_document_changes ON employee_documents;
CREATE TRIGGER trigger_log_employee_document_changes
    AFTER INSERT OR DELETE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_document_changes();

-- 3. Trigger for employee notes
CREATE OR REPLACE FUNCTION log_employee_note_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'note_added',
            jsonb_build_object(
                'note_preview', LEFT(NEW.note_text, 100),
                'note_length', LENGTH(NEW.note_text)
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'note_updated',
            jsonb_build_object(
                'note_preview', LEFT(NEW.note_text, 100),
                'note_length', LENGTH(NEW.note_text),
                'previous_preview', LEFT(OLD.note_text, 100)
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            OLD.employee_id,
            OLD.created_by,
            'note_deleted',
            jsonb_build_object(
                'note_preview', LEFT(OLD.note_text, 100),
                'note_length', LENGTH(OLD.note_text)
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee note changes
DROP TRIGGER IF EXISTS trigger_log_employee_note_changes ON employee_notes;
CREATE TRIGGER trigger_log_employee_note_changes
    AFTER INSERT OR UPDATE OR DELETE ON employee_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_note_changes();

-- 4. Trigger for employee KPIs
CREATE OR REPLACE FUNCTION log_employee_kpi_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'kpi_added',
            jsonb_build_object(
                'kpi_name', NEW.kpi_name,
                'target_value', NEW.target_value,
                'unit', NEW.unit,
                'is_department_default', NEW.is_department_default
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'kpi_updated',
            jsonb_build_object(
                'kpi_name', NEW.kpi_name,
                'target_value', NEW.target_value,
                'unit', NEW.unit,
                'previous_target_value', OLD.target_value,
                'previous_unit', OLD.unit
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee KPI changes
DROP TRIGGER IF EXISTS trigger_log_employee_kpi_changes ON employee_kpis;
CREATE TRIGGER trigger_log_employee_kpi_changes
    AFTER INSERT OR UPDATE ON employee_kpis
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_kpi_changes();

-- 5. Trigger for employee KPI scores
CREATE OR REPLACE FUNCTION log_employee_kpi_score_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'kpi_score_added',
            jsonb_build_object(
                'score', NEW.score,
                'score_date', NEW.score_date,
                'comment', NEW.comment,
                'kpi_id', NEW.kpi_id
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee KPI score changes
DROP TRIGGER IF EXISTS trigger_log_employee_kpi_score_changes ON employee_kpi_scores;
CREATE TRIGGER trigger_log_employee_kpi_score_changes
    AFTER INSERT ON employee_kpi_scores
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_kpi_score_changes();

-- 6. Trigger for employee meetings
CREATE OR REPLACE FUNCTION log_employee_meeting_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            NEW.created_by,
            'meeting_scheduled',
            jsonb_build_object(
                'meeting_title', NEW.title,
                'meeting_type', NEW.meeting_type,
                'scheduled_date', NEW.scheduled_date,
                'duration', NEW.duration_minutes,
                'location', NEW.location
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee meeting changes
DROP TRIGGER IF EXISTS trigger_log_employee_meeting_changes ON employee_meetings;
CREATE TRIGGER trigger_log_employee_meeting_changes
    AFTER INSERT ON employee_meetings
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_meeting_changes();

-- 7. Trigger for employee archive/restore
CREATE OR REPLACE FUNCTION log_employee_archive_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Employee was archived
        IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
            INSERT INTO employee_activity_log (
                employee_id, actor_id, action_type, action_details
            ) VALUES (
                NEW.id,
                NEW.archived_by,
                'employee_archived',
                jsonb_build_object(
                    'archived_at', NEW.archived_at,
                    'archived_by', NEW.archived_by,
                    'reason', 'Employee archived'
                )
            );
        -- Employee was restored
        ELSIF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
            INSERT INTO employee_activity_log (
                employee_id, actor_id, action_type, action_details
            ) VALUES (
                NEW.id,
                COALESCE(NEW.updated_by, NEW.id),
                'employee_restored',
                jsonb_build_object(
                    'restored_at', NEW.updated_at,
                    'restored_by', COALESCE(NEW.updated_by, NEW.id),
                    'reason', 'Employee restored from archive'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee archive changes
DROP TRIGGER IF EXISTS trigger_log_employee_archive_changes ON employees;
CREATE TRIGGER trigger_log_employee_archive_changes
    AFTER UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION log_employee_archive_changes();

-- Add sample activity log data for existing employees
-- This will populate the activity log with some initial data

-- Sample profile updates
INSERT INTO employee_activity_log (employee_id, actor_id, action_type, action_details, created_at)
SELECT 
    e.id,
    e.id,
    'profile_updated',
    jsonb_build_object(
        'changed_fields', ARRAY['department', 'role'],
        'previous_values', jsonb_build_object('department', 'General', 'role', 'Employee'),
        'new_values', jsonb_build_object('department', e.department, 'role', e.role)
    ),
    e.created_at + INTERVAL '1 day'
FROM employees e
WHERE e.department IS NOT NULL
LIMIT 10;

-- Sample document uploads
INSERT INTO employee_activity_log (employee_id, actor_id, action_type, action_details, created_at)
SELECT 
    e.id,
    e.id,
    'document_uploaded',
    jsonb_build_object(
        'document_name', 'Employee Handbook.pdf',
        'document_type', 'Policy',
        'file_size', 1024000,
        'category_id', 1
    ),
    e.created_at + INTERVAL '2 days'
FROM employees e
LIMIT 5;

-- Sample notes
INSERT INTO employee_activity_log (employee_id, actor_id, action_type, action_details, created_at)
SELECT 
    e.id,
    e.id,
    'note_added',
    jsonb_build_object(
        'note_preview', 'Welcome to the team! Please review the employee handbook and complete your onboarding.',
        'note_length', 95
    ),
    e.created_at + INTERVAL '3 days'
FROM employees e
LIMIT 8;

-- Sample KPI additions
INSERT INTO employee_activity_log (employee_id, actor_id, action_type, action_details, created_at)
SELECT 
    e.id,
    e.id,
    'kpi_added',
    jsonb_build_object(
        'kpi_name', 'Customer Satisfaction',
        'target_value', 85,
        'unit', 'percentage',
        'is_department_default', true
    ),
    e.created_at + INTERVAL '4 days'
FROM employees e
WHERE e.department = 'Operations'
LIMIT 3;

-- Sample meetings
INSERT INTO employee_activity_log (employee_id, actor_id, action_type, action_details, created_at)
SELECT 
    e.id,
    e.id,
    'meeting_scheduled',
    jsonb_build_object(
        'meeting_title', 'Performance Review',
        'meeting_type', 'Performance_Review',
        'scheduled_date', CURRENT_DATE + INTERVAL '1 week',
        'duration', 60,
        'location', 'Conference Room A'
    ),
    e.created_at + INTERVAL '5 days'
FROM employees e
LIMIT 4;

-- Create a function to manually log activities from API endpoints
CREATE OR REPLACE FUNCTION log_activity_from_api(
    p_employee_id UUID,
    p_actor_id UUID,
    p_action_type TEXT,
    p_action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO employee_activity_log (
        employee_id, actor_id, action_type, action_details
    ) VALUES (
        p_employee_id, p_actor_id, p_action_type, p_action_details
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the activity logging system
COMMENT ON FUNCTION log_employee_profile_changes() IS 'Automatically logs employee profile changes';
COMMENT ON FUNCTION log_employee_document_changes() IS 'Automatically logs document uploads and deletions';
COMMENT ON FUNCTION log_employee_note_changes() IS 'Automatically logs note additions, updates, and deletions';
COMMENT ON FUNCTION log_employee_kpi_changes() IS 'Automatically logs KPI additions and updates';
COMMENT ON FUNCTION log_employee_kpi_score_changes() IS 'Automatically logs KPI score additions';
COMMENT ON FUNCTION log_employee_meeting_changes() IS 'Automatically logs meeting scheduling';
COMMENT ON FUNCTION log_employee_archive_changes() IS 'Automatically logs employee archive/restore actions';
COMMENT ON FUNCTION log_activity_from_api() IS 'Manually log activities from API endpoints';
