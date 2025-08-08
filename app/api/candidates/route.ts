import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Candidate } from "@/lib/types"

export async function GET() {
  const data = db.candidates.list()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Partial<Candidate>
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 })
  }
  const created = db.candidates.create({
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    cv_url: body.cv_url || "",
    status: (body.status as any) || "New",
    scores: body.scores || { overall: 0 },
    applied_job_id: body.applied_job_id || "",
    job_title: body.job_title || "",
    skills: body.skills || [],
    work_history: body.work_history || [],
  })
  return NextResponse.json({ data: created })
}
