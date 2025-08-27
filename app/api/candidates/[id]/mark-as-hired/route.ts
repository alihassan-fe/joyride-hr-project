import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getSql()
  
  try {
    const candidateId = Number.parseInt(params.id, 10)
    if (Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 })
    }

    // Get candidate data
    const [candidate] = await sql/* sql */`
      SELECT 
        id, name, email, phone, address, department, department_specific_data,
        strengths, weaknesses, notes, cv_link
      FROM candidates 
      WHERE id = ${candidateId}
    `

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Check if candidate is already marked as hired
    const [currentStatus] = await sql/* sql */`
      SELECT cs.name 
      FROM candidates c
      JOIN candidate_statuses cs ON c.status_id = cs.id
      WHERE c.id = ${candidateId}
    `

    if (currentStatus?.name !== 'Hired') {
      return NextResponse.json({ error: "Candidate must be in 'Hired' status first" }, { status: 400 })
    }

    // Create employee profile
    const [employee] = await sql/* sql */`
      INSERT INTO employees (
        name, email, role, start_date, pto_balance, 
        location, phone, department, first_name, last_name
      )
      VALUES (
        ${candidate.name},
        ${candidate.email},
        ${candidate.department || 'Employee'},
        ${new Date().toISOString().split('T')[0]},
        0,
        ${candidate.address || null},
        ${candidate.phone || null},
        ${candidate.department || 'Operations'},
        ${candidate.name.split(' ')[0] || candidate.name},
        ${candidate.name.split(' ').slice(1).join(' ') || ''}
      )
      RETURNING id, name, email, role, start_date, pto_balance, location, phone, department
    `

    // Update candidate notes to indicate employee creation
    await sql/* sql */`
      UPDATE candidates 
      SET notes = COALESCE(notes, '') || '\n\n--- EMPLOYEE CREATED ---\nEmployee ID: ' || ${employee.id} || '\nCreated: ' || ${new Date().toISOString()}
      WHERE id = ${candidateId}
    `

    return NextResponse.json({ 
      success: true, 
      employee,
      message: `Employee profile created for ${candidate.name}` 
    })

  } catch (error) {
    console.error("Error marking candidate as hired:", error)
    return NextResponse.json({ error: "Failed to create employee profile" }, { status: 500 })
  }
}
