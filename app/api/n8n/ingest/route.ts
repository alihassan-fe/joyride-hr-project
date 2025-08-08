import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Expected payload from n8n: { name, email, phone, cv_url, status?, scores?, applied_job_id, job_title?, skills?, work_history? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 })
  }
  const created = db.candidates.create({
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    cv_url: body.cv_url || "",
    status: body.status || "New",
    scores: body.scores || { overall: Math.round(Math.random()*10) },
    applied_job_id: body.applied_job_id || "",
    job_title: body.job_title || "",
    skills: body.skills || [],
    work_history: body.work_history || [],
  })
  return NextResponse.json({ data: created })
}
