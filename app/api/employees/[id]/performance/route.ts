import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const employeeId = params.id

    const performanceRecords = await sql/* sql */`
      SELECT 
        ep.id,
        ep.employee_id,
        ep.score,
        ep.performance_date,
        ep.notes,
        ep.created_by,
        ep.created_at,
        ep.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', epd.id,
              'performance_id', epd.performance_id,
              'document_type', epd.document_type,
              'file_name', epd.file_name,
              'file_path', epd.file_path,
              'file_size', epd.file_size,
              'uploaded_at', epd.uploaded_at
            ) ORDER BY epd.uploaded_at DESC
          ) FILTER (WHERE epd.id IS NOT NULL),
          '[]'::json
        ) as documents
      FROM employee_performance ep
      LEFT JOIN employee_performance_documents epd ON ep.id = epd.performance_id
      WHERE ep.employee_id = ${employeeId}
      GROUP BY ep.id, ep.employee_id, ep.score, ep.performance_date, ep.notes, ep.created_by, ep.created_at, ep.updated_at
      ORDER BY ep.performance_date DESC, ep.created_at DESC
    `

    return NextResponse.json({ data: performanceRecords })
  } catch (error) {
    console.error("Error fetching performance records:", error)
    return NextResponse.json({ error: "Failed to fetch performance records" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const employeeId = params.id
    const body = await req.json()

    const { score, performance_date, notes, created_by } = body

    if (!score || !performance_date) {
      return NextResponse.json({ error: "Score and performance date are required" }, { status: 400 })
    }

    // Validate score range (0-10)
    if (score < 0 || score > 10) {
      return NextResponse.json({ error: "Score must be between 0 and 10" }, { status: 400 })
    }

    const [performanceRecord] = await sql/* sql */`
      INSERT INTO employee_performance (employee_id, score, performance_date, notes, created_by)
      VALUES (${employeeId}, ${score}, ${performance_date}, ${notes || null}, ${created_by || null})
      RETURNING 
        id, employee_id, score, performance_date, notes, created_by, created_at, updated_at
    `

    return NextResponse.json({ data: performanceRecord })
  } catch (error) {
    console.error("Error creating performance record:", error)
    return NextResponse.json({ error: "Failed to create performance record" }, { status: 500 })
  }
}
