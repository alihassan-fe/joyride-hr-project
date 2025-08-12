import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"

// Admin endpoint to view all employee documents across the system
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employee_id")
    const documentType = searchParams.get("document_type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT 
        ed.id,
        ed.employee_id,
        ed.document_type,
        ed.file_name,
        ed.file_path,
        ed.file_size,
        ed.uploaded_at,
        e.name as employee_name,
        e.email as employee_email,
        e.role as employee_role
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
    `

    const conditions = []
    const params = []

    if (employeeId) {
      conditions.push(`ed.employee_id = $${params.length + 1}`)
      params.push(employeeId)
    }

    if (documentType) {
      conditions.push(`ed.document_type = $${params.length + 1}`)
      params.push(documentType)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    query += ` ORDER BY ed.uploaded_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const documents = await sql.unsafe(query, params)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
    `

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`
    }

    const countResult = await sql.unsafe(countQuery, params.slice(0, -2))
    const total = Number(countResult[0]?.total || 0)

    return NextResponse.json({
      documents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Error fetching admin documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
