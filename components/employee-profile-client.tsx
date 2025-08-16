"use client"

import { useState } from "react"
import { DocumentUpload } from "@/components/document-upload"
import { EmployeeNotes } from "@/components/employee-notes"

interface Document {
  id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

interface Note {
  id: number
  employee_id: number
  note: string
  created_by: string
  created_at: string
}

interface EmployeeProfileClientProps {
  employeeId: string
  initialDocuments: Document[]
  initialNotes: Note[]
}

export function EmployeeProfileClient({ employeeId, initialDocuments, initialNotes }: EmployeeProfileClientProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [notes, setNotes] = useState<Note[]>(initialNotes)

  const refreshDocuments = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error("Error refreshing documents:", error)
    }
  }

  const refreshNotes = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      console.error("Error refreshing notes:", error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Documents */}
      <div>
        <DocumentUpload employeeId={Number(employeeId)} documents={documents} onDocumentChange={refreshDocuments} />
      </div>

      {/* Notes */}
      <div>
        <EmployeeNotes employeeId={Number(employeeId)} notes={notes} onNotesChange={refreshNotes} />
      </div>
    </div>
  )
}
