import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const statusId = Number.parseInt(params.id, 10)
    if (Number.isNaN(statusId)) {
      return NextResponse.json({ error: "Invalid status id" }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 })
    }

    const { name, color, sort_order } = body

    // Check if status exists and is not a default status
    const [existingStatus] = await sql/* sql */`
      SELECT is_default FROM candidate_statuses WHERE id = ${statusId}
    `

    if (!existingStatus) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }

    if (existingStatus.is_default) {
      return NextResponse.json({ error: "Cannot modify default statuses" }, { status: 400 })
    }

    const [row] = await sql/* sql */`
      UPDATE candidate_statuses 
      SET 
        name = COALESCE(${name}, name),
        color = COALESCE(${color}, color),
        sort_order = COALESCE(${sort_order}, sort_order)
      WHERE id = ${statusId}
      RETURNING id, name, color, is_default, sort_order, created_at, updated_at
    `

    if (!row) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error("Error updating candidate status:", error)
    return NextResponse.json({ error: "Failed to update candidate status" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const statusId = Number.parseInt(params.id, 10)
    if (Number.isNaN(statusId)) {
      return NextResponse.json({ error: "Invalid status id" }, { status: 400 })
    }

    // Check if status exists and is not a default status
    const [existingStatus] = await sql/* sql */`
      SELECT is_default FROM candidate_statuses WHERE id = ${statusId}
    `

    if (!existingStatus) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 })
    }

    if (existingStatus.is_default) {
      return NextResponse.json({ error: "Cannot delete default statuses" }, { status: 400 })
    }

    // Check if any candidates are using this status
    const [candidateCount] = await sql/* sql */`
      SELECT COUNT(*) as count FROM candidates WHERE status_id = ${statusId}
    `

    if (candidateCount.count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete status that is being used by candidates",
        candidateCount: candidateCount.count 
      }, { status: 400 })
    }

    await sql/* sql */`
      DELETE FROM candidate_statuses WHERE id = ${statusId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting candidate status:", error)
    return NextResponse.json({ error: "Failed to delete candidate status" }, { status: 500 })
  }
}
