import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

export async function GET() {
  const sql = getSql()
  const rows = await sql /* sql */`
    SELECT id, name, email, role, start_date, pto_balance
    FROM employees
    ORDER BY start_date DESC
  `
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
  }

  const sql = getSql()
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.role) {
    return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
  }

  const start = body.start_date ? new Date(body.start_date).toISOString() : new Date().toISOString()
  const pto = Number.isFinite(Number(body.pto_balance)) ? Number(body.pto_balance) : 0

  const [row] = await sql /* sql */`
    INSERT INTO employees (name, email, role, start_date, pto_balance)
    VALUES (${body.name}, ${body.email}, ${body.role}, ${start}, ${pto})
    RETURNING id, name, email, role, start_date, pto_balance
  `
  return NextResponse.json({ data: row })
}