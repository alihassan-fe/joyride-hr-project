import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  const candidateId = parseInt(params.id, 10)
  if (isNaN(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
  }
  const rows = await sql/* sql */`
    SELECT
      id, name, email, phone, cv_url, status, scores, applied_job_id, job_title,
      skills, work_history, notes, created_at
    FROM candidates
    WHERE id = ${candidateId}
  `
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: rows[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  const candidateId = parseInt(params.id, 10)
  if (isNaN(candidateId)) {
    return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
  }
  const patch = await req.json().catch(() => ({}))

  // Optional: sanitize or validate patch.status here to allowed values

  const [row] = await sql/* sql */`
    UPDATE candidates SET
      name = COALESCE(${patch.name}, name),
      email = COALESCE(${patch.email}, email),
      phone = COALESCE(${patch.phone}, phone),
      cv_url = COALESCE(${patch.cv_url}, cv_url),
      status = COALESCE(${patch.status}, status),
      scores = COALESCE(${patch.scores ? JSON.stringify(patch.scores) : null}::jsonb, scores),
      applied_job_id = COALESCE(${patch.applied_job_id}, applied_job_id),
      job_title = COALESCE(${patch.job_title}, job_title),
      skills = COALESCE(${patch.skills ? JSON.stringify(patch.skills) : null}::jsonb, skills),
      work_history = COALESCE(${patch.work_history ? JSON.stringify(patch.work_history) : null}::jsonb, work_history),
      notes = COALESCE(${patch.notes}, notes)
    WHERE id = ${candidateId}
    RETURNING
      id, name, email, phone, cv_url, status, scores, applied_job_id, job_title,
      skills, work_history, notes, created_at
  `
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: row })
}