import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const c = db.candidates.get(params.id)
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: c })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const updated = db.candidates.update(params.id, body)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}
