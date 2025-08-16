"use client"

import { DocumentUpload } from "@/components/document-upload"
import { EmployeeNotes } from "@/components/employee-notes"
import { Document, Note } from "@/lib/types"

export default function EmployeeDocumentsAndNotes({
  employeeId,
  documents,
  notes,
}: {
  employeeId: string
  documents: Document[]
  notes: Note[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <DocumentUpload
          employeeId={employeeId}
          documents={documents}
          onDocumentChange={() => window.location.reload()}
        />
      </div>
      <div>
        <EmployeeNotes
          employeeId={employeeId}
          notes={notes}
          onNotesChange={() => window.location.reload()}
        />
      </div>
    </div>
  )
}