import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function POST(req: NextRequest) {
  const sql = getSql()
  try {
    const body = await req.json()

    const { 
      kpi_id, 
      employee_id, 
      score, 
      score_date, 
      comment,
      created_by 
    } = body

    if (!kpi_id || !employee_id || !score || !score_date) {
      return NextResponse.json({ 
        error: "KPI ID, employee ID, score, and score date are required" 
      }, { status: 400 })
    }

    // Validate score range (0-10)
    if (score < 0 || score > 10) {
      return NextResponse.json({ 
        error: "Score must be between 0 and 10" 
      }, { status: 400 })
    }

    const [kpiScore] = await sql/* sql */`
      INSERT INTO employee_kpi_scores (
        kpi_id, employee_id, score, score_date, comment, created_by
      )
      VALUES (
        ${kpi_id}, ${employee_id}, ${score}, ${score_date}, 
        ${comment || null}, ${created_by || null}
      )
      RETURNING 
        id, kpi_id, employee_id, score, score_date, comment, 
        created_by, created_at
    `

    // Update the current_value in the employee_kpis table
    await sql/* sql */`
      UPDATE employee_kpis 
      SET current_value = ${score}, updated_at = NOW()
      WHERE id = ${kpi_id}
    `

    // Log the activity (this will also be triggered automatically, but we log it here too for API tracking)
    await sql/* sql */`
      SELECT log_activity_from_api(
        ${employee_id}::uuid,
        ${created_by || employee_id}::uuid,
        'kpi_score_added',
        jsonb_build_object(
          'score', ${score},
          'score_date', ${score_date},
          'comment', ${comment || 'No comment'},
          'kpi_id', ${kpi_id}
        )
      )
    `

    return NextResponse.json({ data: kpiScore })
  } catch (error) {
    console.error("Error creating KPI score:", error)
    return NextResponse.json({ error: "Failed to create KPI score" }, { status: 500 })
  }
}
