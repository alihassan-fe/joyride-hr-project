import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET latest broadcasts
export async function GET() {
  try {
    const rows =
      await sql`SELECT id, title, message, created_by, created_at FROM broadcasts ORDER BY created_at DESC LIMIT 50`
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST create broadcast
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, message, created_by } = body
    const rows = await sql`
      INSERT INTO broadcasts (title, message, created_by)
      VALUES (${title}, ${message}, ${created_by})
      RETURNING id, title, message, created_by, created_at
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
