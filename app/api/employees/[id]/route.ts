import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  const rows = await sql /* sql */`
    SELECT id, name, email, role, start_date, pto_balance
    FROM employees
    WHERE id = ${params.id}::uuid
  `
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: rows[0] })
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const sql = getSql()
  const patch = await req.json().catch(() => ({}))
  const [row] = await sql /* sql */`
    UPDATE employees SET
      name = COALESCE(${patch.name}, name),
      email = COALESCE(${patch.email}, email),
      role = COALESCE(${patch.role}, role),
      start_date = COALESCE(${patch.start_date}, start_date),
      pto_balance = COALESCE(${patch.pto_balance}, pto_balance)
    WHERE id = ${context.params.id}::uuid
    RETURNING id, name, email, role, start_date, pto_balance
  `
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: row })
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const sql = getSql()
  const rows = await sql /* sql */`
    DELETE FROM employees
    WHERE id = ${context.params.id}::uuid
    RETURNING id
  `
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
