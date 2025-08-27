import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id;
    const { note, note_text } = await request.json() // <-- snake_case

    if (!note || !note_text) {
      return NextResponse.json({ error: "Note and note_text required" }, { status: 400 })
    }

    // Get the current user's ID to use as created_by
    const currentUserId = (session.user as any).id

    const result = await sql`
      INSERT INTO employee_notes (employee_id, note, note_text, created_by)
      VALUES (${employeeId}, ${note}, ${note_text}, ${currentUserId})
      RETURNING id, employee_id, note, note_text, created_by, created_at
    `

    // Log the activity (this will also be triggered automatically, but we log it here too for API tracking)
    const notePreview = note_text.substring(0, 100)
    const noteLength = note_text.length
    await sql`
      SELECT log_activity_from_api(
        ${employeeId}::uuid,
        ${currentUserId}::uuid,
        'note_added'::text,
        jsonb_build_object(
          'note_preview', ${notePreview}::text,
          'note_length', ${noteLength}::integer
        )
      )
    `

    return NextResponse.json({ note: result[0] })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Failed to create note", details: error.message }, { status: 500 })
  }
}
