-- Migration for employee performance tracking and shift management
-- This adds performance history and shift scheduling capabilities

-- Create employee_performance table
CREATE TABLE IF NOT EXISTS employee_performance (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
  performance_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create employee_performance_documents table for performance-related file uploads
CREATE TABLE IF NOT EXISTS employee_performance_documents (
  id SERIAL PRIMARY KEY,
  performance_id INTEGER NOT NULL REFERENCES employee_performance(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shift_types table
CREATE TABLE IF NOT EXISTS shift_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default shift types (3 shifts for 24/7 coverage)
INSERT INTO shift_types (name, start_time, end_time, color, description) VALUES
  ('Day Shift', '08:00:00', '16:00:00', '#10B981', 'Morning shift 8 AM - 4 PM'),
  ('Evening Shift', '16:00:00', '00:00:00', '#F59E0B', 'Afternoon shift 4 PM - 12 AM'),
  ('Night Shift', '00:00:00', '08:00:00', '#8B5CF6', 'Night shift 12 AM - 8 AM')
ON CONFLICT (name) DO NOTHING;

-- Create employee_shifts table
CREATE TABLE IF NOT EXISTS employee_shifts (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_type_id INTEGER NOT NULL REFERENCES shift_types(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  notes TEXT,
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, shift_date) -- One shift per employee per day
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_date ON employee_performance(performance_date);
CREATE INDEX IF NOT EXISTS idx_employee_performance_documents_performance_id ON employee_performance_documents(performance_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_id ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_date ON employee_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_type_id ON employee_shifts(shift_type_id);

-- Add triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_performance_updated_at 
    BEFORE UPDATE ON employee_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_shifts_updated_at 
    BEFORE UPDATE ON employee_shifts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add current_performance_score column to employees table for quick access
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_performance_score DECIMAL(3,1) CHECK (current_performance_score >= 0 AND current_performance_score <= 10);

-- Create a function to update current performance score
CREATE OR REPLACE FUNCTION update_employee_current_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the employee's current performance score with the latest score
    UPDATE employees 
    SET current_performance_score = (
        SELECT score 
        FROM employee_performance 
        WHERE employee_id = NEW.employee_id 
        ORDER BY performance_date DESC, created_at DESC 
        LIMIT 1
    )
    WHERE id = NEW.employee_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update current performance score
CREATE TRIGGER update_employee_current_performance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON employee_performance
    FOR EACH ROW EXECUTE FUNCTION update_employee_current_performance();

-- Update existing employees with their latest performance score (if any)
UPDATE employees 
SET current_performance_score = (
    SELECT score 
    FROM employee_performance 
    WHERE employee_id = employees.id 
    ORDER BY performance_date DESC, created_at DESC 
    LIMIT 1
);
