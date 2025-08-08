import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Employee } from "@/lib/types"

export async function GET() {
  const data = db.employees.list()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<Employee>
  if (!body?.name || !body?.email || !body?.role) {
    return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
  }
  const created = db.employees.create({
    name: body.name,
    email: body.email,
    role: body.role,
    start_date: body.start_date || new Date().toISOString(),
    pto_balance: body.pto_balance ?? 0,
  })
  return NextResponse.json({ data: created })
}
