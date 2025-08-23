import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  try {
    const rows = await sql/* sql */`
      SELECT
        c.id, c.name, c.email, c.phone, c.address, c.cv_link, 
        c.dispatch, c.operations_manager, c.strengths, c.weaknesses, 
        c.notes, c.recommendation, c.created_at, c.department, c.department_specific_data,
        c.status_id,
        cs.id as status_id, cs.name as status_name, cs.color as status_color, 
        cs.is_default as status_is_default, cs.sort_order as status_sort_order
      FROM candidates c
      LEFT JOIN candidate_statuses cs ON c.status_id = cs.id
      ORDER BY c.created_at DESC
    `
    
    // Transform the data to match the expected format
    const transformedRows = rows.map(row => ({
      ...row,
      status: row.status_id ? {
        id: row.status_id,
        name: row.status_name,
        color: row.status_color,
        is_default: row.status_is_default,
        sort_order: row.status_sort_order,
        created_at: row.created_at, // Using candidate created_at as fallback
        updated_at: row.created_at  // Using candidate created_at as fallback
      } : null
    }))

    return NextResponse.json(transformedRows)
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

    // Get default status_id if not provided
    let statusId = body.status_id
    if (!statusId) {
      const [defaultStatus] = await sql/* sql */`
        SELECT id FROM candidate_statuses WHERE name = 'Shortlist' LIMIT 1
      `
      statusId = defaultStatus?.id
    }

    const [row] = await sql/* sql */`
      INSERT INTO candidates
        (name, email, phone, address, cv_link, dispatch, operations_manager, 
         strengths, weaknesses, notes, recommendation, department, department_specific_data, status_id)
      VALUES
        (${body.name}, ${body.email}, ${body.phone || ""}, ${body.address || ""}, 
         ${body.cv_link || ""}, ${body.dispatch || null}, ${body.operations_manager || null},
         ${JSON.stringify(body.strengths || [])}::jsonb, ${JSON.stringify(body.weaknesses || [])}::jsonb,
         ${body.notes || ""}, ${body.recommendation || "Shortlist"}, ${body.department || "Operations"},
         ${JSON.stringify(body.department_specific_data || {})}::jsonb, ${statusId})
      RETURNING
        id, name, email, phone, address, cv_link, dispatch, operations_manager, 
        strengths, weaknesses, notes, recommendation, created_at, department, department_specific_data, status_id;
    `
    return NextResponse.json({ data: row })
  } catch (error) {
    console.error("Error creating candidate:", error)
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 })
  }
}