-- Enhanced Employee Profile Migration
-- This adds comprehensive employee profile fields, client assignment, KPI tracking, and activity logging

-- Enhance employees table with additional profile fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'Active' CHECK (employment_status IN ('Active', 'Inactive', 'Archived', 'Terminated'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default clients
INSERT INTO clients (name, description) VALUES
  ('JoyRide Logistics, LLC', 'Primary logistics client'),
  ('Allure Trucking, LLC', 'Trucking services client'),
  ('FCE Benefit Administrators Inc.', 'Benefits administration client')
ON CONFLICT (name) DO NOTHING;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Operations', 'Operations department'),
  ('Safety', 'Safety department'),
  ('Maintenance', 'Maintenance department'),
  ('Billing', 'Billing department')
ON CONFLICT (name) DO NOTHING;

-- Create employee_document_categories table for better document organization
CREATE TABLE IF NOT EXISTS employee_document_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_files INTEGER DEFAULT 1,
  max_file_size_mb INTEGER DEFAULT 3,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default document categories
INSERT INTO employee_document_categories (name, description, max_files, is_required, sort_order) VALUES
  ('Tax Document', 'Tax-related documents', 1, TRUE, 1),
  ('Doctor Note', 'Medical documentation', 1, FALSE, 2),
  ('School Diploma', 'Educational credentials', 1, FALSE, 3),
  ('CIPS (Personal ID)', 'Personal identification documents', 1, TRUE, 4),
  ('Bank Statement', 'Banking information', 1, FALSE, 5),
  ('JS Form', 'Job-specific forms', 1, FALSE, 6),
  ('Contract Agreement', 'Employment contracts', 1, TRUE, 7),
  ('Other', 'Additional documents', 5, FALSE, 8)
ON CONFLICT (name) DO NOTHING;

-- Enhance employee_documents table
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES employee_document_categories(id) ON DELETE SET NULL;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create employee_kpis table for KPI tracking
CREATE TABLE IF NOT EXISTS employee_kpis (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  kpi_description TEXT,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2),
  unit TEXT,
  is_department_default BOOLEAN DEFAULT FALSE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create employee_kpi_scores table for KPI performance tracking
CREATE TABLE IF NOT EXISTS employee_kpi_scores (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER NOT NULL REFERENCES employee_kpis(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  score_date DATE NOT NULL,
  comment TEXT,
  document_path TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create employee_activity_log table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS employee_activity_log (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'profile_updated', 'document_uploaded', 'document_deleted', 'note_added', 
    'note_updated', 'note_deleted', 'performance_updated', 'kpi_added', 
    'kpi_updated', 'kpi_score_added', 'pto_requested', 'pto_approved', 
    'pto_rejected', 'employee_archived', 'employee_restored', 'meeting_scheduled'
  )),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create employee_meetings table for HR meeting scheduling
CREATE TABLE IF NOT EXISTS employee_meetings (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('HR_Review', 'Performance_Review', 'Disciplinary', 'Onboarding', 'Exit_Interview', 'Other')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  google_meet_url TEXT,
  google_calendar_id TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_client_id ON employees(client_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at);
CREATE INDEX IF NOT EXISTS idx_employee_documents_category_id ON employee_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_uploaded_by ON employee_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_id ON employee_kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_department_id ON employee_kpis(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_scores_kpi_id ON employee_kpi_scores(kpi_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_scores_employee_id ON employee_kpi_scores(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_scores_date ON employee_kpi_scores(score_date);
CREATE INDEX IF NOT EXISTS idx_employee_activity_log_employee_id ON employee_activity_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_log_actor_id ON employee_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_log_action_type ON employee_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_employee_activity_log_created_at ON employee_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_meetings_employee_id ON employee_meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_meetings_scheduled_date ON employee_meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_employee_meetings_status ON employee_meetings(status);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_employee_kpis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_employee_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at_trigger 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_employees_updated_at();

CREATE TRIGGER update_employee_kpis_updated_at_trigger 
    BEFORE UPDATE ON employee_kpis 
    FOR EACH ROW EXECUTE FUNCTION update_employee_kpis_updated_at();

CREATE TRIGGER update_employee_meetings_updated_at_trigger 
    BEFORE UPDATE ON employee_meetings 
    FOR EACH ROW EXECUTE FUNCTION update_employee_meetings_updated_at();

-- Create function to log employee activities
CREATE OR REPLACE FUNCTION log_employee_activity(
    p_employee_id UUID,
    p_actor_id UUID,
    p_action_type TEXT,
    p_action_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO employee_activity_log (
        employee_id, actor_id, action_type, action_details, ip_address, user_agent
    ) VALUES (
        p_employee_id, p_actor_id, p_action_type, p_action_details, p_ip_address, p_user_agent
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get employee tenure
CREATE OR REPLACE FUNCTION get_employee_tenure(employee_start_date DATE)
RETURNS TEXT AS $$
DECLARE
    years INTEGER;
    months INTEGER;
    days INTEGER;
BEGIN
    SELECT 
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, employee_start_date))::INTEGER,
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, employee_start_date))::INTEGER,
        EXTRACT(DAY FROM AGE(CURRENT_DATE, employee_start_date))::INTEGER
    INTO years, months, days;
    
    IF years > 0 THEN
        RETURN years || ' year' || CASE WHEN years > 1 THEN 's' ELSE '' END || 
               CASE WHEN months > 0 THEN ', ' || months || ' month' || CASE WHEN months > 1 THEN 's' ELSE '' END ELSE '' END;
    ELSIF months > 0 THEN
        RETURN months || ' month' || CASE WHEN months > 1 THEN 's' ELSE '' END;
    ELSE
        RETURN days || ' day' || CASE WHEN days > 1 THEN 's' ELSE '' END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate employee age
CREATE OR REPLACE FUNCTION calculate_employee_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Update existing employees to set first_name and last_name from name
UPDATE employees 
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN name) > 0 
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Set default client for existing employees
UPDATE employees 
SET client_id = '1' 
WHERE client_id IS NULL;

-- Set default department for existing employees
UPDATE employees 
SET department = 'Operations' 
WHERE department IS NULL;
