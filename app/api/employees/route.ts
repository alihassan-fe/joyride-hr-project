import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  const rows = await sql/* sql */`
    SELECT id, name, email, role, start_date, pto_balance
    FROM employees
    ORDER BY start_date DESC
  `
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const sql = getSql()
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.role) {
    return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
  }
  const [row] = await sql/* sql */`
    INSERT INTO employees (name, email, role, start_date, pto_balance)
    VALUES (${body.name}, ${body.email}, ${body.role}, ${body.start_date || new Date().toISOString()}, ${body.pto_balance ?? 0})
    RETURNING id, name, email, role, start_date, pto_balance
  `
  return NextResponse.json({ data: row })
}
