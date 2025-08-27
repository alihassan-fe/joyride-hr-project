-- Fix Activity Logging Triggers
-- This file fixes the activity logging triggers to handle null actor_id values properly

-- 1. Fix document upload trigger to handle null uploaded_by
CREATE OR REPLACE FUNCTION log_employee_document_changes()
RETURNS TRIGGER AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID (first admin user or first user)
    SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users LIMIT 1;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            COALESCE(NEW.uploaded_by, fallback_user_id), -- Use fallback user ID
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
            COALESCE(OLD.uploaded_by, fallback_user_id), -- Use fallback user ID
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

-- 2. Fix note changes trigger to handle null created_by
CREATE OR REPLACE FUNCTION log_employee_note_changes()
RETURNS TRIGGER AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID (first admin user or first user)
    SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users LIMIT 1;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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
            COALESCE(OLD.created_by, fallback_user_id), -- Use fallback user ID
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

-- 3. Fix KPI changes trigger to handle null created_by
CREATE OR REPLACE FUNCTION log_employee_kpi_changes()
RETURNS TRIGGER AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID (first admin user or first user)
    SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users LIMIT 1;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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

-- 4. Fix KPI score changes trigger to handle null created_by
CREATE OR REPLACE FUNCTION log_employee_kpi_score_changes()
RETURNS TRIGGER AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID (first admin user or first user)
    SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users LIMIT 1;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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

-- 5. Fix meeting changes trigger to handle null created_by
CREATE OR REPLACE FUNCTION log_employee_meeting_changes()
RETURNS TRIGGER AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID (first admin user or first user)
    SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users LIMIT 1;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO employee_activity_log (
            employee_id, actor_id, action_type, action_details
        ) VALUES (
            NEW.employee_id,
            COALESCE(NEW.created_by, fallback_user_id), -- Use fallback user ID
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

-- Add comment to document the fix
COMMENT ON FUNCTION log_employee_document_changes() IS 'Automatically logs document uploads and deletions with fallback actor_id';
COMMENT ON FUNCTION log_employee_note_changes() IS 'Automatically logs note additions, updates, and deletions with fallback actor_id';
COMMENT ON FUNCTION log_employee_kpi_changes() IS 'Automatically logs KPI additions and updates with fallback actor_id';
COMMENT ON FUNCTION log_employee_kpi_score_changes() IS 'Automatically logs KPI score additions with fallback actor_id';
COMMENT ON FUNCTION log_employee_meeting_changes() IS 'Automatically logs meeting scheduling with fallback actor_id';
