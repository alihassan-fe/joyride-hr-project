import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

// Get all shift types
export async function GET() {
  const sql = getSql()
  try {
    const shiftTypes = await sql/* sql */`
      SELECT id, name, start_time, end_time, color, description, created_at
      FROM shift_types
      ORDER BY start_time ASC
    `
    return NextResponse.json({ data: shiftTypes })
  } catch (error) {
    console.error("Error fetching shift types:", error)
    return NextResponse.json({ error: "Failed to fetch shift types" }, { status: 500 })
  }
}

// Create new shift type
export async function POST(req: NextRequest) {
  const sql = getSql()
  try {
    const body = await req.json()
    const { name, start_time, end_time, color, description } = body

    if (!name || !start_time || !end_time) {
      return NextResponse.json({ error: "Name, start time, and end time are required" }, { status: 400 })
    }

    const [shiftType] = await sql/* sql */`
      INSERT INTO shift_types (name, start_time, end_time, color, description)
      VALUES (${name}, ${start_time}, ${end_time}, ${color || '#3B82F6'}, ${description || null})
      RETURNING id, name, start_time, end_time, color, description, created_at
    `

    return NextResponse.json({ data: shiftType })
  } catch (error) {
    console.error("Error creating shift type:", error)
    return NextResponse.json({ error: "Failed to create shift type" }, { status: 500 })
  }
}
