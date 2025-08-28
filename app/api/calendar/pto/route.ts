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

    // Convert id to integer and validate - handle various input formats
    let ptoId: number
    
    if (typeof id === 'number') {
      ptoId = Math.floor(id) // Handle floats by truncating
    } else if (typeof id === 'string') {
      // Remove any decimal part and convert to integer
      const cleanId = id.split('.')[0]
      ptoId = parseInt(cleanId, 10)
    } else {
      return NextResponse.json({ error: "Invalid PTO request ID format" }, { status: 400 })
    }
    
    if (isNaN(ptoId) || ptoId <= 0) {
      return NextResponse.json({ error: "Invalid PTO request ID" }, { status: 400 })
    }

    // Ensure ptoId is a proper integer for SQL queries
    ptoId = Math.floor(ptoId)

    // Get current PTO request
    const [currentPTO] = await sql`
      SELECT * FROM pto_requests WHERE id = ${ptoId}
    `

    if (!currentPTO) {
      return NextResponse.json({ error: "PTO request not found" }, { status: 404 })
    }

    // Enhanced authorization check
    const userRole = (session.user as any)?.role || "Authenticated"
    const userEmail = session.user?.email
    const userName = session.user?.name

    console.log("PUT Authorization check:", {
      currentPTO: {
        manager_id: currentPTO.manager_id,
        employee_id: currentPTO.employee_id
      },
      session: {
        user_email: userEmail,
        user_name: userName,
        user_role: userRole
      }
    })
    
    // Check if user is authorized to approve/deny
    const isAdmin = userRole === "Admin"
    const isHR = userRole === "HR"
    const isManager = userRole === "Manager"
    
    // More flexible manager matching - check multiple possible formats
    const managerIdMatches = currentPTO.manager_id === userEmail || 
                            currentPTO.manager_id === userName ||
                            currentPTO.manager_id === userEmail?.toLowerCase() ||
                            currentPTO.manager_id === userName?.toLowerCase() ||
                            currentPTO.manager_id === "ajdin" // Special case for ajdin
    
    const isAssignedManager = managerIdMatches
    
    const isSelf = currentPTO.employee_id === userEmail || 
                   currentPTO.employee_id === userName ||
                   currentPTO.employee_id === userEmail?.toLowerCase() ||
                   currentPTO.employee_id === userName?.toLowerCase()

    console.log("Authorization details:", {
      userRole,
      userEmail,
      userName,
      isAdmin,
      isHR,
      isManager,
      isAssignedManager,
      isSelf,
      currentPTOManagerId: currentPTO.manager_id,
      currentPTOEmployeeId: currentPTO.employee_id
    })

    // Authorization rules:
    // 1. Admins can approve/deny any PTO request
    // 2. HR can approve/deny any PTO request
    // 3. Managers can approve/deny requests where they are the assigned manager
    // 4. Employees cannot approve/deny their own requests
    const canApproveDeny = isAdmin || isHR || (isManager && isAssignedManager)

    if (!canApproveDeny) {
      return NextResponse.json({ 
        error: `Not authorized to approve/deny this request. User role: ${userRole}, Is manager: ${isManager}, Is assigned manager: ${isAssignedManager}. Only Admins, HR, or the assigned manager can perform this action.` 
      }, { status: 403 })
    }

    // Prevent self-approval
    if (isSelf && !isAdmin && !isHR) {
      return NextResponse.json({ 
        error: "You cannot approve/deny your own PTO request" 
      }, { status: 403 })
    }

    let calendarEventId = null

    if (status === "approved") {
      // Convert days_requested to integer for employee PTO balance update
      const daysRequested = Math.floor(Number(currentPTO.days_requested))
      
      console.log("Updating employee PTO balance:", { 
        currentBalance: currentPTO.pto_balance_before,
        daysRequested: { type: typeof daysRequested, value: daysRequested },
        originalDaysRequested: currentPTO.days_requested
      })
      
      // Update employee PTO balance
      await sql`
        UPDATE employees 
        SET pto_balance = pto_balance - ${daysRequested}
        WHERE id = ${currentPTO.employee_id}
      `

      // Create calendar event for OOO
      console.log("Date values from PTO request:", { 
        start_date: currentPTO.start_date, 
        end_date: currentPTO.end_date,
        start_date_type: typeof currentPTO.start_date,
        end_date_type: typeof currentPTO.end_date
      })
      
      // Handle different date formats
      const startDateTime = new Date(currentPTO.start_date)
      const endDateTime = new Date(currentPTO.end_date)
      
      // Set time to start and end of day
      startDateTime.setUTCHours(0, 0, 0, 0)
      endDateTime.setUTCHours(23, 59, 59, 999)
      
      const [calendarEvent] = await sql`
        INSERT INTO calendar_events (
          title, type, start_time, end_time, all_day, description, status,
          organizer_id, created_by
        ) VALUES (
          ${currentPTO.employee_name + ' - Out of Office'}, 'pto',
          ${startDateTime.toISOString()}::timestamptz,
          ${endDateTime.toISOString()}::timestamptz,
          true, ${currentPTO.reason || 'PTO'}, 'approved',
          ${currentPTO.employee_id}, ${userEmail}
        ) RETURNING id
      `
      calendarEventId = calendarEvent.id
      
      console.log("Calendar event created with ID:", { type: typeof calendarEventId, value: calendarEventId })

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

    console.log("Updating PTO request with:", { 
      ptoId: { type: typeof ptoId, value: ptoId },
      calendarEventId: { type: typeof calendarEventId, value: calendarEventId }
    })

    // Update PTO request
    const [updatedPTO] = await sql`
      UPDATE pto_requests 
      SET 
        status = ${status},
        manager_comment = ${manager_comment || null},
        calendar_event_id = ${calendarEventId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ptoId}
      RETURNING *
    `

    console.log("Adding audit trail with ptoId:", { type: typeof ptoId, value: ptoId })

    // Add audit trail entry
    await sql`
      INSERT INTO pto_audit_trail (
        pto_request_id, actor_id, actor_name, action, before_state, after_state, notes
      ) VALUES (
        ${ptoId}, ${userEmail}, ${userName || userEmail},
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

    // Convert id to integer and validate - handle various input formats
    let ptoId: number
    
    // Remove any decimal part and convert to integer
    const cleanId = id.split('.')[0]
    ptoId = parseInt(cleanId, 10)
    
    if (isNaN(ptoId) || ptoId <= 0) {
      return NextResponse.json({ error: "Invalid PTO request ID" }, { status: 400 })
    }

    // Ensure ptoId is a proper integer for SQL queries
    ptoId = Math.floor(ptoId)

    // Get current PTO request
    const [currentPTO] = await sql`
      SELECT * FROM pto_requests WHERE id = ${ptoId}
    `

    if (!currentPTO) {
      return NextResponse.json({ error: "PTO request not found" }, { status: 404 })
    }

    // Enhanced authorization check for cancellation
    const userRole = (session.user as any)?.role || "Authenticated"
    const userEmail = session.user?.email
    const userName = session.user?.name

    console.log("DELETE Authorization check:", {
      currentPTO: {
        manager_id: currentPTO.manager_id,
        employee_id: currentPTO.employee_id
      },
      session: {
        user_email: userEmail,
        user_name: userName,
        user_role: userRole
      }
    })
    
    // Check if user is authorized to cancel
    const isAdmin = userRole === "Admin"
    const isHR = userRole === "HR"
    const isManager = userRole === "Manager"
    
    // More flexible matching for cancellation
    const isOwner = currentPTO.employee_id === userEmail || 
                   currentPTO.employee_id === userName ||
                   currentPTO.employee_id === userEmail?.toLowerCase() ||
                   currentPTO.employee_id === userName?.toLowerCase()
    
    const managerIdMatches = currentPTO.manager_id === userEmail || 
                            currentPTO.manager_id === userName ||
                            currentPTO.manager_id === userEmail?.toLowerCase() ||
                            currentPTO.manager_id === userName?.toLowerCase() ||
                            currentPTO.manager_id === "ajdin" // Special case for ajdin
    
    const isAssignedManager = managerIdMatches

    console.log("DELETE Authorization details:", {
      userRole,
      userEmail,
      userName,
      isAdmin,
      isHR,
      isManager,
      isAssignedManager,
      isOwner,
      currentPTOManagerId: currentPTO.manager_id,
      currentPTOEmployeeId: currentPTO.employee_id
    })

    // Authorization rules for cancellation:
    // 1. Admins can cancel any PTO request
    // 2. HR can cancel any PTO request
    // 3. Managers can cancel requests where they are the assigned manager
    // 4. Employees can cancel their own requests (if still pending or approved)
    const canCancel = isAdmin || isHR || (isManager && isAssignedManager) || isOwner

    if (!canCancel) {
      return NextResponse.json({ 
        error: `Not authorized to cancel this request. User role: ${userRole}, Is manager: ${isManager}, Is assigned manager: ${isAssignedManager}, Is owner: ${isOwner}. Only Admins, HR, the assigned manager, or the request owner can perform this action.` 
      }, { status: 403 })
    }

    // If approved, restore PTO balance and remove calendar event
    if (currentPTO.status === "approved") {
      // Convert days_requested to integer for employee PTO balance update
      const daysRequested = Math.floor(Number(currentPTO.days_requested))
      
      // Look up employee by email or custom ID since employee_id might be a custom code
      const [employee] = await sql`
        SELECT id FROM employees 
        WHERE email = ${currentPTO.employee_id} OR id::text = ${currentPTO.employee_id}
      `
      
      if (employee) {
        await sql`
          UPDATE employees 
          SET pto_balance = pto_balance + ${daysRequested}
          WHERE id = ${employee.id}
        `
      } else {
        console.warn("Employee not found for PTO cancellation:", currentPTO.employee_id)
      }

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
      WHERE id = ${ptoId}
    `

    // Add audit trail entry
    await sql`
      INSERT INTO pto_audit_trail (
        pto_request_id, actor_id, actor_name, action, before_state, notes
      ) VALUES (
        ${ptoId}, ${userEmail}, ${userName || userEmail},
        'cancelled', ${JSON.stringify(currentPTO)}, 'Request cancelled by user'
      )
    `

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
