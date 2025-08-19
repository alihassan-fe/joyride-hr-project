import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  try {
    const sql = getSql()
    const employees = await sql`
      SELECT 
        id, name, email, job_title, department, manager_id, 
        office_location, employment_status, team_id
      FROM employees 
      WHERE employment_status = 'active'
      ORDER BY department, name
    `

    return NextResponse.json({ data: employees })
  } catch (error) {
    console.error("Failed to fetch employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}
