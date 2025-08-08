import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const e = db.employees.get(params.id)
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: e })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const updated = db.employees.update(params.id, body)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}
