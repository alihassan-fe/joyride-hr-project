import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

// Get employee shifts with optional date range filtering
export async function GET(req: NextRequest) {
  const sql = getSql()
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const employeeId = searchParams.get('employee_id')

    // Build the query using SQL template syntax
    let shifts
    if (startDate && endDate && employeeId) {
      shifts = await sql/* sql */`
        SELECT 
          es.id,
          es.employee_id,
          es.shift_type_id,
          es.shift_date,
          es.notes,
          es.assigned_by,
          es.created_at,
          es.updated_at,
          st.id as shift_type_id,
          st.name as shift_type_name,
          st.start_time as shift_start_time,
          st.end_time as shift_end_time,
          st.color as shift_color,
          st.description as shift_description,
          e.name as employee_name,
          e.email as employee_email
        FROM employee_shifts es
        JOIN shift_types st ON es.shift_type_id = st.id
        JOIN employees e ON es.employee_id = e.id
        WHERE es.shift_date >= ${startDate} 
          AND es.shift_date <= ${endDate}
          AND es.employee_id = ${employeeId}
        ORDER BY es.shift_date ASC, st.start_time ASC
      `
    } else if (startDate && endDate) {
      shifts = await sql/* sql */`
        SELECT 
          es.id,
          es.employee_id,
          es.shift_type_id,
          es.shift_date,
          es.notes,
          es.assigned_by,
          es.created_at,
          es.updated_at,
          st.id as shift_type_id,
          st.name as shift_type_name,
          st.start_time as shift_start_time,
          st.end_time as shift_end_time,
          st.color as shift_color,
          st.description as shift_description,
          e.name as employee_name,
          e.email as employee_email
        FROM employee_shifts es
        JOIN shift_types st ON es.shift_type_id = st.id
        JOIN employees e ON es.employee_id = e.id
        WHERE es.shift_date >= ${startDate} 
          AND es.shift_date <= ${endDate}
        ORDER BY es.shift_date ASC, st.start_time ASC
      `
    } else if (employeeId) {
      shifts = await sql/* sql */`
        SELECT 
          es.id,
          es.employee_id,
          es.shift_type_id,
          es.shift_date,
          es.notes,
          es.assigned_by,
          es.created_at,
          es.updated_at,
          st.id as shift_type_id,
          st.name as shift_type_name,
          st.start_time as shift_start_time,
          st.end_time as shift_end_time,
          st.color as shift_color,
          st.description as shift_description,
          e.name as employee_name,
          e.email as employee_email
        FROM employee_shifts es
        JOIN shift_types st ON es.shift_type_id = st.id
        JOIN employees e ON es.employee_id = e.id
        WHERE es.employee_id = ${employeeId}
        ORDER BY es.shift_date ASC, st.start_time ASC
      `
    } else {
      shifts = await sql/* sql */`
        SELECT 
          es.id,
          es.employee_id,
          es.shift_type_id,
          es.shift_date,
          es.notes,
          es.assigned_by,
          es.created_at,
          es.updated_at,
          st.id as shift_type_id,
          st.name as shift_type_name,
          st.start_time as shift_start_time,
          st.end_time as shift_end_time,
          st.color as shift_color,
          st.description as shift_description,
          e.name as employee_name,
          e.email as employee_email
        FROM employee_shifts es
        JOIN shift_types st ON es.shift_type_id = st.id
        JOIN employees e ON es.employee_id = e.id
        ORDER BY es.shift_date ASC, st.start_time ASC
      `
    }
    
    return NextResponse.json({ data: shifts })
  } catch (error) {
    console.error("Error fetching employee shifts:", error)
    return NextResponse.json({ error: "Failed to fetch employee shifts" }, { status: 500 })
  }
}

// Assign shift to employee
export async function POST(req: NextRequest) {
  const sql = getSql()
  try {
    const body = await req.json()
    const { employee_id, shift_type_id, shift_date, notes, assigned_by } = body

    if (!employee_id || !shift_type_id || !shift_date) {
      return NextResponse.json({ error: "Employee ID, shift type ID, and shift date are required" }, { status: 400 })
    }

    // Validate that the employee exists
    const [employee] = await sql/* sql */`
      SELECT id FROM employees WHERE id = ${employee_id}
    `
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Validate that the shift type exists
    const [shiftType] = await sql/* sql */`
      SELECT id FROM shift_types WHERE id = ${shift_type_id}
    `
    if (!shiftType) {
      return NextResponse.json({ error: "Shift type not found" }, { status: 404 })
    }

    // Check if employee already has a shift on this date
    const [existingShift] = await sql/* sql */`
      SELECT id FROM employee_shifts 
      WHERE employee_id = ${employee_id} AND shift_date = ${shift_date}
    `

    if (existingShift) {
      return NextResponse.json({ error: "Employee already has a shift assigned on this date" }, { status: 400 })
    }

    // Handle assigned_by - if it's not a valid UUID, set it to null
    let assignedByValue = null
    if (assigned_by && assigned_by !== "admin") {
      // Check if assigned_by is a valid employee UUID
      const [assigner] = await sql/* sql */`
        SELECT id FROM employees WHERE id = ${assigned_by}
      `
      if (assigner) {
        assignedByValue = assigned_by
      }
    }

    const [shift] = await sql/* sql */`
      INSERT INTO employee_shifts (employee_id, shift_type_id, shift_date, notes, assigned_by)
      VALUES (${employee_id}, ${shift_type_id}, ${shift_date}, ${notes || null}, ${assignedByValue})
      RETURNING 
        id, employee_id, shift_type_id, shift_date, notes, assigned_by, created_at, updated_at
    `

    return NextResponse.json({ data: shift })
  } catch (error) {
    console.error("Error assigning shift:", error)
    return NextResponse.json({ 
      error: "Failed to assign shift",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
