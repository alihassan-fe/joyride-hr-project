import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

export async function GET() {
  const sql = getSql()
  const rows = await sql /* sql */`
    SELECT id, name, email, role, start_date, pto_balance, location, phone, department, current_performance_score, employment_status
    FROM employees
    ORDER BY start_date DESC
  `
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const sql = getSql()
  const body = await req.json()
  const [row] = await sql /* sql */`
    INSERT INTO employees (name, email, role, start_date, pto_balance, location, phone, department)
    VALUES (
      ${body.name},
      ${body.email},
      ${body.role},
      ${body.start_date},
      ${body.pto_balance},
      ${body.location},
      ${body.phone},
      ${body.department}
    )
    RETURNING id, name, email, role, start_date, pto_balance, location, phone, department, current_performance_score, employment_status
  `
  return NextResponse.json({ data: row })
}
