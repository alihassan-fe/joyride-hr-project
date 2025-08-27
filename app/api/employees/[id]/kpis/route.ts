import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const employeeId = params.id

    const kpis = await sql/* sql */`
      SELECT 
        ek.id, ek.employee_id, ek.kpi_name, ek.kpi_description, ek.target_value,
        ek.current_value, ek.unit, ek.is_department_default, ek.department_id,
        ek.is_active, ek.created_by, ek.created_at, ek.updated_at,
        -- Department information
        d.name as department_name,
        -- Creator information
        c.name as creator_name
      FROM employee_kpis ek
      LEFT JOIN departments d ON ek.department_id = d.id
      LEFT JOIN employees c ON ek.created_by = c.id
      WHERE ek.employee_id = ${employeeId} AND ek.is_active = true
      ORDER BY ek.created_at DESC
    `

    return NextResponse.json({ data: kpis })
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id
    const body = await req.json()

    const { 
      kpi_name, 
      kpi_description, 
      target_value, 
      current_value, 
      unit, 
      is_department_default, 
      department_id
    } = body

    if (!kpi_name || !target_value) {
      return NextResponse.json({ error: "KPI name and target value are required" }, { status: 400 })
    }

    // Validate target value is a positive number
    if (target_value <= 0) {
      return NextResponse.json({ error: "Target value must be a positive number" }, { status: 400 })
    }

    // Get the current user's ID to use as created_by
    const currentUserId = (session.user as any).id

    const [kpi] = await sql/* sql */`
      INSERT INTO employee_kpis (
        employee_id, kpi_name, kpi_description, target_value, current_value, 
        unit, is_department_default, department_id, created_by
      )
      VALUES (
        ${employeeId}, ${kpi_name}, ${kpi_description || null}, ${target_value}, 
        ${current_value || null}, ${unit || null}, ${is_department_default || false}, 
        ${department_id || null}, ${currentUserId}
      )
      RETURNING 
        id, employee_id, kpi_name, kpi_description, target_value, current_value,
        unit, is_department_default, department_id, is_active, created_by, 
        created_at, updated_at
    `

    // Log the activity (this will also be triggered automatically, but we log it here too for API tracking)
    const unitValue = unit || 'units'
    const isDefault = is_department_default || false
    await sql/* sql */`
      SELECT log_activity_from_api(
        ${employeeId}::uuid,
        ${currentUserId}::uuid,
        'kpi_added'::text,
        jsonb_build_object(
          'kpi_name', ${kpi_name}::text,
          'target_value', ${target_value}::numeric,
          'unit', ${unitValue}::text,
          'is_department_default', ${isDefault}::boolean
        )
      )
    `

    return NextResponse.json({ data: kpi })
  } catch (error) {
    console.error("Error creating KPI:", error)
    return NextResponse.json({ error: "Failed to create KPI" }, { status: 500 })
  }
}
