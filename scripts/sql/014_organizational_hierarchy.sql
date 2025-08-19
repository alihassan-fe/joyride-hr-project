-- Organizational Hierarchy Schema
-- Adds manager relationships, departments, teams, and locations for org chart functionality

-- Add organizational fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS team_id UUID,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'terminated')),
ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT start_date,
ADD COLUMN IF NOT EXISTS office_location TEXT;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  team_lead_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organizational positions table for vacant positions
CREATE TABLE IF NOT EXISTS org_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_vacant BOOLEAN DEFAULT true,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_team_id ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_teams_department ON teams(department);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_vacant ON org_positions(is_vacant);
CREATE INDEX IF NOT EXISTS idx_org_positions_department ON org_positions(department);

-- Insert sample departments and teams
INSERT INTO teams (name, department, location) VALUES 
('Operations Team', 'Operations', 'Main Office'),
('Dispatch Team', 'Operations', 'Main Office'),
('Safety Team', 'Safety', 'Main Office'),
('Maintenance Team', 'Maintenance', 'Workshop'),
('Billing Team', 'Billing Payroll', 'Main Office'),
('Payroll Team', 'Billing Payroll', 'Main Office')
ON CONFLICT DO NOTHING;

-- Update existing employees with sample organizational data
UPDATE employees 
SET department = 'Operations', 
    job_title = COALESCE(role, 'Employee'),
    hire_date = COALESCE(start_date, CURRENT_DATE)
WHERE department IS NULL;
