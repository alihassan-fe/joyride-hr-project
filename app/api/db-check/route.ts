import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  try {
    // Check if required tables exist
    const tables = await sql/* sql */`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employee_shifts', 'shift_types', 'employees')
      ORDER BY table_name
    `

    // Check if shift_types has data
    const shiftTypesCount = await sql/* sql */`
      SELECT COUNT(*) as count FROM shift_types
    `

    // Check if employees has data
    const employeesCount = await sql/* sql */`
      SELECT COUNT(*) as count FROM employees
    `

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      shiftTypesCount: shiftTypesCount[0]?.count || 0,
      employeesCount: employeesCount[0]?.count || 0,
      status: "Database check completed"
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json({ 
      error: "Database check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
