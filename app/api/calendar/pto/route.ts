import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

// GET /api/calendar/pto - Get PTO requests with filtering
export async function GET(req: NextRequest) {
  try {
    const sql = getSql()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const employee_id = searchParams.get("employee_id")
    const department = searchParams.get("department")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")
    
    // Build the query using template literals
    let rows
    if (status && employee_id && department && start_date && end_date) {
      rows = await sql/* sql */`
        SELECT 
          pr.id, pr.employee_id, pr.employee_name, pr.start_date, pr.end_date,
          pr.reason, pr.status, pr.manager_id, pr.manager_name, pr.manager_comment,
          pr.department, pr.days_requested, pr.pto_balance_before, pr.pto_balance_after,
          pr.is_full_day, pr.start_time, pr.end_time, pr.calendar_event_id,
          pr.created_at, pr.updated_at,
          (SELECT COUNT(*) FROM pto_audit_trail pat WHERE pat.pto_request_id = pr.id) as audit_count
        FROM pto_requests pr
        WHERE pr.status = ${status}
          AND pr.employee_id = ${employee_id}
          AND pr.department = ${department}
          AND pr.start_date >= ${start_date}
          AND pr.end_date <= ${end_date}
        ORDER BY pr.created_at DESC LIMIT 100
      `
    } else if (status && employee_id && department) {
      rows = await sql/* sql */`
        SELECT 
          pr.id, pr.employee_id, pr.employee_name, pr.start_date, pr.end_date,
          pr.reason, pr.status, pr.manager_id, pr.manager_name, pr.manager_comment,
          pr.department, pr.days_requested, pr.pto_balance_before, pr.pto_balance_after,
          pr.is_full_day, pr.start_time, pr.end_time, pr.calendar_event_id,
          pr.created_at, pr.updated_at,
          (SELECT COUNT(*) FROM pto_audit_trail pat WHERE pat.pto_request_id = pr.id) as audit_count
        FROM pto_requests pr
        WHERE pr.status = ${status}
          AND pr.employee_id = ${employee_id}
          AND pr.department = ${department}
        ORDER BY pr.created_at DESC LIMIT 100
      `
    } else if (status && employee_id) {
      rows = await sql/* sql */`
        SELECT 
          pr.id, pr.employee_id, pr.employee_name, pr.start_date, pr.end_date,
          pr.reason, pr.status, pr.manager_id, pr.manager_name, pr.manager_comment,
          pr.department, pr.days_requested, pr.pto_balance_before, pr.pto_balance_after,
          pr.is_full_day, pr.start_time, pr.end_time, pr.calendar_event_id,
          pr.created_at, pr.updated_at,
          (SELECT COUNT(*) FROM pto_audit_trail pat WHERE pat.pto_request_id = pr.id) as audit_count
        FROM pto_requests pr
        WHERE pr.status = ${status}
          AND pr.employee_id = ${employee_id}
        ORDER BY pr.created_at DESC LIMIT 100
      `
    } else if (status) {
      rows = await sql/* sql */`
        SELECT 
          pr.id, pr.employee_id, pr.employee_name, pr.start_date, pr.end_date,
          pr.reason, pr.status, pr.manager_id, pr.manager_name, pr.manager_comment,
          pr.department, pr.days_requested, pr.pto_balance_before, pr.pto_balance_after,
          pr.is_full_day, pr.start_time, pr.end_time, pr.calendar_event_id,
          pr.created_at, pr.updated_at,
          (SELECT COUNT(*) FROM pto_audit_trail pat WHERE pat.pto_request_id = pr.id) as audit_count
        FROM pto_requests pr
        WHERE pr.status = ${status}
        ORDER BY pr.created_at DESC LIMIT 100
      `
    } else {
      rows = await sql/* sql */`
        SELECT 
          pr.id, pr.employee_id, pr.employee_name, pr.start_date, pr.end_date,
          pr.reason, pr.status, pr.manager_id, pr.manager_name, pr.manager_comment,
          pr.department, pr.days_requested, pr.pto_balance_before, pr.pto_balance_after,
          pr.is_full_day, pr.start_time, pr.end_time, pr.calendar_event_id,
          pr.created_at, pr.updated_at,
          (SELECT COUNT(*) FROM pto_audit_trail pat WHERE pat.pto_request_id = pr.id) as audit_count
        FROM pto_requests pr
        ORDER BY pr.created_at DESC LIMIT 100
      `
    }
    
    // Return the actual data
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    console.error("Error in PTO GET endpoint:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/calendar/pto - Create new PTO request
export async function POST(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      employee_id,
      start_date,
      end_date,
      is_full_day = true,
      start_time,
      end_time,
      reason,
      manager_id
    } = body

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get employee information
    const [employee] = await sql`
      SELECT id, name, email, department, pto_balance, manager_id
      FROM employees 
      WHERE id = ${employee_id}
    `

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Calculate days requested (simplified calculation)
    const start = new Date(start_date)
    const end = new Date(end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Check if employee has enough PTO balance
    if (days > employee.pto_balance) {
      return NextResponse.json({ 
        error: "Insufficient PTO balance", 
        current_balance: employee.pto_balance,
        requested_days: days
      }, { status: 400 })
    }

    // Get manager information
    let managerName = null
    if (manager_id) {
      const [manager] = await sql`
        SELECT name FROM employees WHERE id = ${manager_id}
      `
      managerName = manager?.name
    }

    // Create PTO request
    const [ptoRequest] = await sql`
      INSERT INTO pto_requests (
        employee_id, employee_name, start_date, end_date, reason, status,
        manager_id, manager_name, department, days_requested,
        pto_balance_before, pto_balance_after, is_full_day, start_time, end_time
      ) VALUES (
        ${employee_id}, ${employee.name}, ${start_date}, ${end_date}, ${reason || null},
        'pending', ${manager_id || employee.manager_id}, ${managerName}, ${employee.department},
        ${days}, ${employee.pto_balance}, ${employee.pto_balance - days},
        ${is_full_day}, ${start_time || null}, ${end_time || null}
      ) RETURNING id
    `

    // Add audit trail entry
    await sql`
      INSERT INTO pto_audit_trail (
        pto_request_id, actor_id, actor_name, action, after_state
      ) VALUES (
        ${ptoRequest.id}, ${session.user?.email}, ${session.user?.name || session.user?.email},
        'submitted', ${JSON.stringify({ employee_id, start_date, end_date, days_requested: days })}
      )
    `

    return NextResponse.json({ id: ptoRequest.id, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/calendar/pto - Update PTO request (approve/deny)
export async function PUT(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, status, manager_comment } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get current PTO request
    const [currentPTO] = await sql`
      SELECT * FROM pto_requests WHERE id = ${id}
    `

    if (!currentPTO) {
      return NextResponse.json({ error: "PTO request not found" }, { status: 404 })
    }

    // Check if user is authorized to approve/deny
    console.log("PUT Authorization check:", {
      currentPTO: {
        manager_id: currentPTO.manager_id,
        employee_id: currentPTO.employee_id
      },
      session: {
        user_email: session.user?.email,
        user_name: session.user?.name
      }
    })
    
    const isManager = currentPTO.manager_id === session.user?.email || 
                     currentPTO.manager_id === session.user?.name

    if (!isManager) {
      return NextResponse.json({ error: "Not authorized to approve/deny this request" }, { status: 403 })
    }

    let calendarEventId = null

    if (status === "approved") {
      // Update employee PTO balance
      await sql`
        UPDATE employees 
        SET pto_balance = pto_balance - ${currentPTO.days_requested}
        WHERE id = ${currentPTO.employee_id}
      `

      // Create calendar event for OOO
      const [calendarEvent] = await sql`
        INSERT INTO calendar_events (
          title, type, start_time, end_time, all_day, description, status,
          organizer_id, created_by
        ) VALUES (
          ${currentPTO.employee_name + ' - Out of Office'}, 'pto',
          ${currentPTO.start_date + ' 00:00:00'}::timestamptz,
          ${currentPTO.end_date + ' 23:59:59'}::timestamptz,
          true, ${currentPTO.reason || 'PTO'}, 'approved',
          ${currentPTO.employee_id}, ${session.user?.email}
        ) RETURNING id
      `
      calendarEventId = calendarEvent.id

      // Add employee as attendee
      await sql`
        INSERT INTO calendar_attendees (
          event_id, attendee_type, attendee_id, attendee_name, attendee_email
        ) VALUES (
          ${calendarEventId}, 'employee', ${currentPTO.employee_id},
          ${currentPTO.employee_name}, ${currentPTO.employee_id}
        )
      `
    }

    // Update PTO request
    const [updatedPTO] = await sql`
      UPDATE pto_requests 
      SET 
        status = ${status},
        manager_comment = ${manager_comment || null},
        calendar_event_id = ${calendarEventId},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // Add audit trail entry
    await sql`
      INSERT INTO pto_audit_trail (
        pto_request_id, actor_id, actor_name, action, before_state, after_state, notes
      ) VALUES (
        ${id}, ${session.user?.email}, ${session.user?.name || session.user?.email},
        ${status === 'approved' ? 'approved' : 'denied'}, 
        ${JSON.stringify(currentPTO)}, ${JSON.stringify(updatedPTO)},
        ${manager_comment || null}
      )
    `

    return NextResponse.json({ success: true, pto_request: updatedPTO })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/calendar/pto - Cancel PTO request
export async function DELETE(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "PTO request ID required" }, { status: 400 })
    }

    // Get current PTO request
    const [currentPTO] = await sql`
      SELECT * FROM pto_requests WHERE id = ${id}
    `

    if (!currentPTO) {
      return NextResponse.json({ error: "PTO request not found" }, { status: 404 })
    }

    // Check if user is authorized to cancel
    console.log("DELETE Authorization check:", {
      currentPTO: {
        manager_id: currentPTO.manager_id,
        employee_id: currentPTO.employee_id
      },
      session: {
        user_email: session.user?.email,
        user_name: session.user?.name
      }
    })
    
    const isOwner = currentPTO.employee_id === session.user?.email || 
                   currentPTO.employee_id === session.user?.name
    const isManager = currentPTO.manager_id === session.user?.email || 
                     currentPTO.manager_id === session.user?.name

    if (!isOwner && !isManager) {
      return NextResponse.json({ error: "Not authorized to cancel this request" }, { status: 403 })
    }

    // If approved, restore PTO balance and remove calendar event
    if (currentPTO.status === "approved") {
      await sql`
        UPDATE employees 
        SET pto_balance = pto_balance + ${currentPTO.days_requested}
        WHERE id = ${currentPTO.employee_id}
      `

      if (currentPTO.calendar_event_id) {
        await sql`
          UPDATE calendar_events 
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = ${currentPTO.calendar_event_id}
        `
      }
    }

    // Update PTO request status
    await sql`
      UPDATE pto_requests 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id}
    `

    // Add audit trail entry
    await sql`
      INSERT INTO pto_audit_trail (
        pto_request_id, actor_id, actor_name, action, before_state, notes
      ) VALUES (
        ${id}, ${session.user?.email}, ${session.user?.name || session.user?.email},
        'cancelled', ${JSON.stringify(currentPTO)}, 'Request cancelled by user'
      )
    `

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
