-- Employee Documents and Notes System
-- Supports 7 document types with file storage via Vercel Blob

-- Employee documents table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'tax_document',
    'doctor_note', 
    'school_diploma',
    'cips',
    'bank_statement',
    'js_form',
    'contract_agreement'
  )),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Vercel Blob URL
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(employee_id, document_type) -- One document per type per employee
);

-- Employee notes table for general profile notes
CREATE TABLE IF NOT EXISTS employee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_notes_employee_id ON employee_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_created_at ON employee_notes(created_at DESC);

-- Add location and phone fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
