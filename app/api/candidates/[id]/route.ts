import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

// Columns now in Neon (public.candidates):
// id, name, email, phone, cv_link, dispatch (int), operations_manager (int),
// strengths (jsonb), weaknesses (jsonb), notes (text), recommendation (text), created_at

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const candidateId = Number.parseInt(params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    const rows = await sql/* sql */`
      SELECT
        id,
        name,
        email,
        phone,
        cv_link,
        dispatch,
        operations_manager,
        strengths,
        weaknesses,
        notes,
        recommendation,
        created_at
      FROM candidates
      WHERE id = ${candidateId}
    `

    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data: rows[0] })
  } catch (err) {
    console.error("GET /api/candidates/[id] error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const sql = getSql()
    const candidateId = Number.parseInt(context.params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    const patch = await req.json().catch(() => ({} as Record<string, unknown>))

    // Allowed fields for partial updates
    const {
      name = null,
      email = null,
      phone = null,
      cv_link = null,
      dispatch = null,
      operations_manager = null,
      strengths = null,
      weaknesses = null,
      notes = null,
      recommendation = null,
    } = patch as {
      name?: string | null
      email?: string | null
      phone?: string | null
      cv_link?: string | null
      dispatch?: number | null
      operations_manager?: number | null
      strengths?: unknown[] | null
      weaknesses?: unknown[] | null
      notes?: string | null
      recommendation?: string | null
    }

    // Perform safe partial update using COALESCE to keep existing values on null
    const [row] = await sql/* sql */`
      UPDATE candidates SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        cv_link = COALESCE(${cv_link}, cv_link),
        dispatch = COALESCE(${dispatch}, dispatch),
        operations_manager = COALESCE(${operations_manager}, operations_manager),
        strengths = COALESCE(${strengths !== null ? JSON.stringify(strengths) : null}::jsonb, strengths),
        weaknesses = COALESCE(${weaknesses !== null ? JSON.stringify(weaknesses) : null}::jsonb, weaknesses),
        notes = COALESCE(${notes}, notes),
        recommendation = COALESCE(${recommendation}, recommendation)
      WHERE id = ${candidateId}
      RETURNING
        id,
        name,
        email,
        phone,
        cv_link,
        dispatch,
        operations_manager,
        strengths,
        weaknesses,
        notes,
        recommendation,
        created_at
    `

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data: row })
  } catch (err) {
    console.error("PATCH /api/candidates/[id] error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
