import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employeeId = params.id;

    const notes = await sql`
      SELECT id, employee_id, note, note_text, created_by, created_at
      FROM employee_notes 
      WHERE employee_id = ${employeeId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employeeId = params.id;
    const { note, note_text, created_by } = await request.json() // <-- snake_case

    if (!note || !note_text || !created_by) {
      return NextResponse.json({ error: "Note, note_text, and created_by required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO employee_notes (employee_id, note, note_text, created_by)
      VALUES (${employeeId}, ${note}, ${note_text}, ${created_by})
      RETURNING id, employee_id, note, note_text, created_by, created_at
    `

    return NextResponse.json({ note: result[0] })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Failed to create note", details: error.message }, { status: 500 })
  }
}
