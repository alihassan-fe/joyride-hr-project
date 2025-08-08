import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

// Expected payload from n8n: { name, email, phone, cv_url, status?, scores?, applied_job_id, job_title?, skills?, work_history?, notes? }
export async function POST(req: NextRequest) {
  const sql = getSql()
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 })
  }
  const [row] = await sql/* sql */`
    INSERT INTO candidates
      (name, email, phone, cv_url, status, scores, applied_job_id, job_title, skills, work_history, notes)
    VALUES
      (${body.name}, ${body.email}, ${body.phone || ""}, ${body.cv_url || ""}, ${body.status || "New"},
       ${JSON.stringify(body.scores || {})}::jsonb, ${body.applied_job_id || null}, ${body.job_title || ""},
       ${JSON.stringify(body.skills || [])}::jsonb, ${JSON.stringify(body.work_history || [])}::jsonb, ${body.notes || ""})
    RETURNING id, name, email, phone, cv_url, status, scores, applied_job_id, job_title, skills, work_history, notes, created_at
  `
  return NextResponse.json({ data: row })
}
