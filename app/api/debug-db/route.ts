import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  
  try {
    // Check the structure of the employees table
    const tableInfo = await sql /* sql */`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY ordinal_position
    `
    
    // Try to get a sample employee to see what data exists
    const sampleEmployee = await sql /* sql */`
      SELECT * FROM employees LIMIT 1
    `
    
    return NextResponse.json({
      tableStructure: tableInfo,
      sampleEmployee: sampleEmployee[0] || null,
      message: "Database structure check completed"
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to check database structure"
    }, { status: 500 })
  }
}
