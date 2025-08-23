import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

// Columns now in Neon (public.candidates):
// id, name, email, phone, address, cv_link, department, department_specific_data (jsonb),
// strengths (jsonb), weaknesses (jsonb), notes (text), recommendation (text), created_at, status_id

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const candidateId = Number.parseInt(params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    const rows = await sql /* sql */`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.cv_link,
        c.department,
        c.department_specific_data,
        c.strengths,
        c.weaknesses,
        c.notes,
        c.recommendation,
        c.created_at,
        c.status_id,
        cs.id as status_id, cs.name as status_name, cs.color as status_color, 
        cs.is_default as status_is_default, cs.sort_order as status_sort_order
      FROM candidates c
      LEFT JOIN candidate_statuses cs ON c.status_id = cs.id
      WHERE c.id = ${candidateId}
    `

    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const candidate = rows[0]
    const departmentData = candidate.department_specific_data || {}

    // Extract legacy fields for backward compatibility
    const result = {
      ...candidate,
      // Legacy fields for existing UI components
      dispatch: departmentData.dispatch || 0,
      operations_manager: departmentData.operations_manager || 0,
      maintenance_officer: departmentData.maintenance_officer || 0,
      internal_safety_supervisor: departmentData.internal_safety_supervisor || 0,
      recruiter: departmentData.recruiter || 0,
      safety_officer: departmentData.safety_officer || 0,
      recruiting_retention_officer: departmentData.recruiting_retention_officer || 0,
      // Status information
      status: candidate.status_id ? {
        id: candidate.status_id,
        name: candidate.status_name,
        color: candidate.status_color,
        is_default: candidate.status_is_default,
        sort_order: candidate.status_sort_order,
        created_at: candidate.created_at,
        updated_at: candidate.created_at
      } : null
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error("GET /api/candidates/[id] error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const candidateId = Number.parseInt(params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    const patch = await req.json().catch(() => ({}) as Record<string, unknown>)

    const {
      name = null,
      email = null,
      phone = null,
      address = null,
      cv_link = null,
      department = null,
      department_specific_data = null,
      strengths = null,
      weaknesses = null,
      notes = null,
      recommendation = null,
      status_id = null,
      // Legacy fields for backward compatibility
      dispatch = null,
      operations_manager = null,
    } = patch as {
      name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
      cv_link?: string | null
      department?: string | null
      department_specific_data?: Record<string, any> | null
      strengths?: unknown[] | null
      weaknesses?: unknown[] | null
      notes?: string | null
      recommendation?: string | null
      status_id?: number | null
      dispatch?: number | null
      operations_manager?: number | null
    }

    let finalDepartmentData = department_specific_data
    if (dispatch !== null || operations_manager !== null) {
      // Get current department data
      const [currentRow] = await sql /* sql */`
        SELECT department_specific_data FROM candidates WHERE id = ${candidateId}
      `
      const currentData = currentRow?.department_specific_data || {}

      finalDepartmentData = {
        ...currentData,
        ...(dispatch !== null && { dispatch }),
        ...(operations_manager !== null && { operations_manager }),
      }
    }

    const [row] = await sql /* sql */`
      UPDATE candidates SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        address = COALESCE(${address}, address),
        cv_link = COALESCE(${cv_link}, cv_link),
        department = COALESCE(${department}, department),
        department_specific_data = COALESCE(${finalDepartmentData ? JSON.stringify(finalDepartmentData) : null}::jsonb, department_specific_data),
        strengths = COALESCE(${strengths !== null ? JSON.stringify(strengths) : null}::jsonb, strengths),
        weaknesses = COALESCE(${weaknesses !== null ? JSON.stringify(weaknesses) : null}::jsonb, weaknesses),
        notes = COALESCE(${notes}, notes),
        recommendation = COALESCE(${recommendation}, recommendation),
        status_id = COALESCE(${status_id}, status_id)
      WHERE id = ${candidateId}
      RETURNING
        id,
        name,
        email,
        phone,
        address,
        cv_link,
        department,
        department_specific_data,
        strengths,
        weaknesses,
        notes,
        recommendation,
        created_at,
        status_id
    `

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const departmentData = row.department_specific_data || {}
    const result = {
      ...row,
      dispatch: departmentData.dispatch || 0,
      operations_manager: departmentData.operations_manager || 0,
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error("PATCH /api/candidates/[id] error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const candidateId = Number.parseInt(params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    // Check if candidate exists
    const [existingCandidate] = await sql /* sql */`
      SELECT id FROM candidates WHERE id = ${candidateId}
    `

    if (!existingCandidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Delete the candidate
    await sql /* sql */`
      DELETE FROM candidates WHERE id = ${candidateId}
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/candidates/[id] error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}