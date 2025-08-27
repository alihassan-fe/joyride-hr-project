import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

export async function GET() {
  const sql = getSql()
  try {
    const rows = await sql/* sql */`
      SELECT id, name, color, is_default, sort_order, created_at, updated_at
      FROM candidate_statuses
      ORDER BY sort_order ASC, name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching candidate statuses:", error)
    return NextResponse.json({ error: "Failed to fetch candidate statuses", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any)?.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sql = getSql()
  try {
    const body = await req.json().catch(() => null)
    if (!body?.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    // Get the highest sort_order and increment by 1
    const [maxOrder] = await sql/* sql */`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM candidate_statuses
    `
    const newSortOrder = maxOrder.max_order + 1

    const [row] = await sql/* sql */`
      INSERT INTO candidate_statuses (name, color, sort_order)
      VALUES (${body.name}, ${body.color || '#6B7280'}, ${newSortOrder})
      RETURNING id, name, color, is_default, sort_order, created_at, updated_at
    `
    return NextResponse.json({ data: row })
  } catch (error) {
    console.error("Error creating candidate status:", error)
    return NextResponse.json({ error: "Failed to create candidate status" }, { status: 500 })
  }
}
