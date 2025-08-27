-- Create the missing log_activity_from_api function
-- This function is called by API endpoints to manually log activities

CREATE OR REPLACE FUNCTION log_activity_from_api(
    p_employee_id UUID,
    p_actor_id UUID,
    p_action_type TEXT,
    p_action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    fallback_user_id UUID;
BEGIN
    -- Get a fallback user ID if actor_id is null
    IF p_actor_id IS NULL THEN
        SELECT id INTO fallback_user_id FROM users WHERE role = 'Admin' LIMIT 1;
        IF fallback_user_id IS NULL THEN
            SELECT id INTO fallback_user_id FROM users LIMIT 1;
        END IF;
    END IF;
    
    INSERT INTO employee_activity_log (
        employee_id, actor_id, action_type, action_details
    ) VALUES (
        p_employee_id, 
        COALESCE(p_actor_id, fallback_user_id), 
        p_action_type, 
        p_action_details
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the function
COMMENT ON FUNCTION log_activity_from_api(UUID, UUID, TEXT, JSONB) IS 'Manually log activities from API endpoints with fallback actor_id';
