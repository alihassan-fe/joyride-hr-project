import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET all or by status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  try {
    const rows = status
      ? await sql`SELECT * FROM pto_requests WHERE status = ${status} ORDER BY created_at DESC LIMIT 500`
      : await sql`SELECT * FROM pto_requests ORDER BY created_at DESC LIMIT 500`
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST create PTO request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employee_id, employee_name, start_date, end_date, reason } = body
    const rows = await sql`
      INSERT INTO pto_requests (employee_id, employee_name, start_date, end_date, reason)
      VALUES (${employee_id}, ${employee_name}, ${start_date}, ${end_date}, ${reason})
      RETURNING *
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// PATCH approve/reject
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, manager_id, manager_comment } = body
    const rows = await sql`
      UPDATE pto_requests
      SET status = ${status}, manager_id = ${manager_id}, manager_comment = ${manager_comment}
      WHERE id = ${id}
      RETURNING *
    `
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(rows[0], { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
