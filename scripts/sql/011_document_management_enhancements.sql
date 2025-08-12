-- Add missing columns to employee_documents table for better document management

-- Add updated_at column for tracking document metadata changes
ALTER TABLE employee_documents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add notes column for document-specific notes
ALTER TABLE employee_documents 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the notes table to use proper column name
ALTER TABLE employee_notes 
RENAME COLUMN note TO note_text;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to employee_documents
DROP TRIGGER IF EXISTS update_employee_documents_updated_at ON employee_documents;
CREATE TRIGGER update_employee_documents_updated_at
    BEFORE UPDATE ON employee_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_updated_at ON employee_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_type ON employee_documents(employee_id, document_type);
