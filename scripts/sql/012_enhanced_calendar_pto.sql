-- Enhanced Calendar and PTO System Migration
-- This adds comprehensive interview scheduling and PTO management capabilities

-- Ensure calendar_events table exists
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pto','holiday','interview')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT
);

-- Enhance calendar_events table with additional fields
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'cancelled', 'pending', 'approved', 'denied'));
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS conflict_flags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS coverage_warnings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_meet_url TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS organizer_id TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS pre_buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS post_buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 30;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create calendar_audit_trail table for tracking changes
CREATE TABLE IF NOT EXISTS calendar_audit_trail (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'rescheduled', 'cancelled', 'approved', 'denied')),
  before_state JSONB,
  after_state JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create calendar_conflicts table for conflict tracking
CREATE TABLE IF NOT EXISTS calendar_conflicts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  conflicting_event_id INTEGER REFERENCES calendar_events(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('hard', 'soft', 'coverage')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure pto_requests table exists
CREATE TABLE IF NOT EXISTS pto_requests (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  manager_id TEXT,
  manager_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance pto_requests table with additional fields
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS days_requested DECIMAL(5,1);
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS pto_balance_before DECIMAL(5,1);
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS pto_balance_after DECIMAL(5,1);
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS is_full_day BOOLEAN DEFAULT TRUE;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS calendar_event_id INTEGER REFERENCES calendar_events(id);
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create pto_audit_trail table for PTO changes
CREATE TABLE IF NOT EXISTS pto_audit_trail (
  id SERIAL PRIMARY KEY,
  pto_request_id INTEGER NOT NULL REFERENCES pto_requests(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'denied', 'modified', 'cancelled')),
  before_state JSONB,
  after_state JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Create calendar_attendees table for tracking event participants
CREATE TABLE IF NOT EXISTS calendar_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  attendee_type TEXT NOT NULL CHECK (attendee_type IN ('employee', 'candidate', 'external')),
  attendee_id TEXT,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
  response_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create calendar_reminders table for event reminders
CREATE TABLE IF NOT EXISTS calendar_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'popup', 'sms')),
  minutes_before INTEGER NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create business_hours table for working hours configuration
CREATE TABLE IF NOT EXISTS business_hours (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working_day BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default business hours (Monday-Friday, 9 AM - 5 PM)
INSERT INTO business_hours (day_of_week, start_time, end_time, is_working_day) VALUES
  (1, '09:00:00', '17:00:00', TRUE),  -- Monday
  (2, '09:00:00', '17:00:00', TRUE),  -- Tuesday
  (3, '09:00:00', '17:00:00', TRUE),  -- Wednesday
  (4, '09:00:00', '17:00:00', TRUE),  -- Thursday
  (5, '09:00:00', '17:00:00', TRUE),  -- Friday
  (0, '00:00:00', '00:00:00', FALSE), -- Sunday
  (6, '00:00:00', '00:00:00', FALSE)  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Create conflict_policies table for defining conflict rules
CREATE TABLE IF NOT EXISTS conflict_policies (
  id SERIAL PRIMARY KEY,
  policy_name TEXT NOT NULL UNIQUE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('interview', 'pto', 'general')),
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('hard', 'soft')),
  description TEXT,
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default conflict policies
INSERT INTO conflict_policies (policy_name, policy_type, conflict_type, description, rules) VALUES
  ('Interview Buffer', 'interview', 'soft', 'Minimum buffer between interviews', '{"min_buffer_minutes": 15}'),
  ('PTO Overlap', 'pto', 'soft', 'Soft conflict when multiple team members are on PTO', '{"max_overlap_percentage": 50}'),
  ('Business Hours', 'general', 'hard', 'Hard conflict for events outside business hours', '{"enforce_business_hours": true}'),
  ('Double Booking', 'general', 'hard', 'Hard conflict for double booking same person', '{"prevent_double_booking": true}')
ON CONFLICT (policy_name) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_timerange ON calendar_events (start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events (type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_trail_event_id ON calendar_audit_trail(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_audit_trail_timestamp ON calendar_audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_event_id ON calendar_conflicts(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_resolved ON calendar_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_event_id ON calendar_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_attendees_email ON calendar_attendees(attendee_email);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event_id ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_sent ON calendar_reminders(sent);
CREATE INDEX IF NOT EXISTS idx_pto_requests_status ON pto_requests (status);
CREATE INDEX IF NOT EXISTS idx_pto_requests_date ON pto_requests (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pto_requests_department ON pto_requests(department);
CREATE INDEX IF NOT EXISTS idx_pto_requests_manager ON pto_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_pto_requests_calendar_event ON pto_requests(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_pto_audit_trail_pto_id ON pto_audit_trail(pto_request_id);
CREATE INDEX IF NOT EXISTS idx_pto_audit_trail_timestamp ON pto_audit_trail(timestamp);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_pto_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at_trigger 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();

CREATE TRIGGER update_pto_requests_updated_at_trigger 
    BEFORE UPDATE ON pto_requests 
    FOR EACH ROW EXECUTE FUNCTION update_pto_requests_updated_at();

-- Create function to calculate PTO days
CREATE OR REPLACE FUNCTION calculate_pto_days(start_date DATE, end_date DATE, is_full_day BOOLEAN)
RETURNS DECIMAL(5,1) AS $$
DECLARE
    days_count DECIMAL(5,1);
BEGIN
    IF is_full_day THEN
        -- Count business days only
        SELECT COUNT(*)::DECIMAL(5,1)
        INTO days_count
        FROM generate_series(start_date, end_date, '1 day'::interval) AS date_series
        WHERE EXTRACT(DOW FROM date_series) BETWEEN 1 AND 5; -- Monday to Friday
    ELSE
        -- For partial days, calculate based on hours
        days_count := 0.5; -- Default to half day for partial days
    END IF;
    
    RETURN days_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for conflicts
CREATE OR REPLACE FUNCTION check_calendar_conflicts(
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    attendee_emails TEXT[],
    exclude_event_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    conflict_type TEXT,
    severity TEXT,
    description TEXT,
    conflicting_event_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ce.type = 'interview' THEN 'hard'
            WHEN ce.type = 'pto' THEN 'soft'
            ELSE 'soft'
        END as conflict_type,
        CASE 
            WHEN ce.type = 'interview' THEN 'high'
            WHEN ce.type = 'pto' THEN 'medium'
            ELSE 'low'
        END as severity,
        'Conflict with ' || ce.title || ' (' || ce.type || ')' as description,
        ce.id as conflicting_event_id
    FROM calendar_events ce
    JOIN calendar_attendees ca ON ce.id = ca.event_id
    WHERE ca.attendee_email = ANY(attendee_emails)
    AND ce.id != COALESCE(exclude_event_id, -1)
    AND ce.status NOT IN ('cancelled', 'denied')
    AND (
        (event_start < ce.end_time AND event_end > ce.start_time) OR
        (ce.start_time < event_end AND ce.end_time > event_start)
    );
END;
$$ LANGUAGE plpgsql;
