import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  try {
    const rows = await sql/* sql */`
      SELECT
        id, name, email, phone, address, cv_link, 
        dispatch, operations_manager, strengths, weaknesses, 
        notes, recommendation, created_at, department, department_specific_data
      FROM candidates
      ORDER BY created_at DESC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching candidates:", error)
    return NextResponse.json({ error: "Failed to fetch candidates", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = getSql()
  try {
    const body = await req.json().catch(() => null)
    if (!body?.name || !body?.email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 })
    }

    const [row] = await sql/* sql */`
      INSERT INTO candidates
        (name, email, phone, address, cv_link, dispatch, operations_manager, 
         strengths, weaknesses, notes, recommendation, department, department_specific_data)
      VALUES
        (${body.name}, ${body.email}, ${body.phone || ""}, ${body.address || ""}, 
         ${body.cv_link || ""}, ${body.dispatch || null}, ${body.operations_manager || null},
         ${JSON.stringify(body.strengths || [])}::jsonb, ${JSON.stringify(body.weaknesses || [])}::jsonb,
         ${body.notes || ""}, ${body.recommendation || "Shortlist"}, ${body.department || "Operations"},
         ${JSON.stringify(body.department_specific_data || {})}::jsonb)
      RETURNING
        id, name, email, phone, address, cv_link, dispatch, operations_manager, 
        strengths, weaknesses, notes, recommendation, created_at, department, department_specific_data;
    `
    return NextResponse.json({ data: row })
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 })
  }
}