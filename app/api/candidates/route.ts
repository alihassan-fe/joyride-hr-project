import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  const rows = await sql/* sql */`
    SELECT
      id, name, email, phone, cv_link, dispatch, operations_manager, strengths,
      weaknesses, notes, recommendation
    FROM candidates
    ORDER BY created_at DESC
  `
  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const sql = getSql()
  const body = await req.json().catch(() => null)

  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 })
  }

const [row] = await sql/* sql */`
  INSERT INTO candidates
    (name, email, phone, cv_link, dispatch, operations_manager, strengths,
     weaknesses, notes, recommendation)
  VALUES
    (
      ${body.name},
      ${body.email},
      ${body.phone || ""},
      ${body.cv_link || ""},
      ${body.dispatch || ""},
      ${body.operations_manager || ""},
      ${JSON.stringify(body.strengths || [])}::jsonb,
      ${JSON.stringify(body.weaknesses || [])}::jsonb,
      ${body.notes || ""},
      ${body.recommendation || ""}
    )
  RETURNING
    id, name, email, phone, cv_link, dispatch, operations_manager, strengths,
    weaknesses, notes, recommendation, created_at;
  `

  return NextResponse.json({ data: row })
}