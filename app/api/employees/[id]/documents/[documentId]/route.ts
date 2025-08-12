import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"

// Get specific document details
export async function GET(request: NextRequest, { params }: { params: { id: string; documentId: string } }) {
  try {
    const employeeId = params.id
    const documentId = params.documentId

    const document = await sql`
      SELECT 
        ed.*,
        e.name as employee_name,
        e.email as employee_email
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      WHERE ed.id = ${documentId} AND ed.employee_id = ${employeeId}
    `

    if (document.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document: document[0] })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
  }
}

// Update document metadata (notes, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string; documentId: string } }) {
  try {
    const employeeId = params.id
    const documentId = params.documentId
    const { notes } = await request.json()

    const result = await sql`
      UPDATE employee_documents 
      SET notes = ${notes}, updated_at = NOW()
      WHERE id = ${documentId} AND employee_id = ${employeeId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document: result[0] })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}
