import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

// GET /api/calendar/events?start=ISO&end=ISO
export async function GET(req: NextRequest) {
  const sql = getSql()
  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const type = searchParams.get("type")
  
  try {
    // Use a simpler approach that works with our custom SQL function
    let rows
    if (start && end && type) {
      rows = await sql`
        SELECT 
          ce.id, ce.title, ce.type, ce.status,
          to_char(ce.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
          to_char(ce.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
          ce.all_day, ce.created_by, ce.updated_at,
          ce.description, ce.location, ce.timezone,
          ce.google_calendar_id, ce.google_meet_url, ce.organizer_id,
          ce.pre_buffer_minutes, ce.post_buffer_minutes, ce.reminder_minutes,
          ce.tags, COALESCE(ce.meta, '{}'::jsonb) AS meta,
          COALESCE(ce.conflict_flags, '[]'::jsonb) AS conflict_flags,
          COALESCE(ce.coverage_warnings, '[]'::jsonb) AS coverage_warnings,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ca.id,
                'attendee_type', ca.attendee_type,
                'attendee_id', ca.attendee_id,
                'attendee_name', ca.attendee_name,
                'attendee_email', ca.attendee_email,
                'response_status', ca.response_status,
                'response_timestamp', ca.response_timestamp
              )
            ) FROM calendar_attendees ca WHERE ca.event_id = ce.id), 
            '[]'::json
          ) as attendees
        FROM calendar_events ce
        WHERE ce.start_time <= ${start}::timestamptz 
          AND ce.end_time >= ${end}::timestamptz 
          AND ce.type = ${type}
        ORDER BY ce.start_time ASC LIMIT 500
      `
    } else if (start && end) {
      rows = await sql`
        SELECT 
          ce.id, ce.title, ce.type, ce.status,
          to_char(ce.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
          to_char(ce.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
          ce.all_day, ce.created_by, ce.updated_at,
          ce.description, ce.location, ce.timezone,
          ce.google_calendar_id, ce.google_meet_url, ce.organizer_id,
          ce.pre_buffer_minutes, ce.post_buffer_minutes, ce.reminder_minutes,
          ce.tags, COALESCE(ce.meta, '{}'::jsonb) AS meta,
          COALESCE(ce.conflict_flags, '[]'::jsonb) AS conflict_flags,
          COALESCE(ce.coverage_warnings, '[]'::jsonb) AS coverage_warnings,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ca.id,
                'attendee_type', ca.attendee_type,
                'attendee_id', ca.attendee_id,
                'attendee_name', ca.attendee_name,
                'attendee_email', ca.attendee_email,
                'response_status', ca.response_status,
                'response_timestamp', ca.response_timestamp
              )
            ) FROM calendar_attendees ca WHERE ca.event_id = ce.id), 
            '[]'::json
          ) as attendees
        FROM calendar_events ce
        WHERE ce.start_time <= ${start}::timestamptz 
          AND ce.end_time >= ${end}::timestamptz
        ORDER BY ce.start_time ASC LIMIT 500
      `
    } else if (type) {
      rows = await sql`
        SELECT 
          ce.id, ce.title, ce.type, ce.status,
          to_char(ce.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
          to_char(ce.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
          ce.all_day, ce.created_by, ce.updated_at,
          ce.description, ce.location, ce.timezone,
          ce.google_calendar_id, ce.google_meet_url, ce.organizer_id,
          ce.pre_buffer_minutes, ce.post_buffer_minutes, ce.reminder_minutes,
          ce.tags, COALESCE(ce.meta, '{}'::jsonb) AS meta,
          COALESCE(ce.conflict_flags, '[]'::jsonb) AS conflict_flags,
          COALESCE(ce.coverage_warnings, '[]'::jsonb) AS coverage_warnings,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ca.id,
                'attendee_type', ca.attendee_type,
                'attendee_id', ca.attendee_id,
                'attendee_name', ca.attendee_name,
                'attendee_email', ca.attendee_email,
                'response_status', ca.response_status,
                'response_timestamp', ca.response_timestamp
              )
            ) FROM calendar_attendees ca WHERE ca.event_id = ce.id), 
            '[]'::json
          ) as attendees
        FROM calendar_events ce
        WHERE ce.type = ${type}
        ORDER BY ce.start_time ASC LIMIT 500
      `
    } else {
      rows = await sql`
        SELECT 
          ce.id, ce.title, ce.type, ce.status,
          to_char(ce.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
          to_char(ce.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
          ce.all_day, ce.created_by, ce.updated_at,
          ce.description, ce.location, ce.timezone,
          ce.google_calendar_id, ce.google_meet_url, ce.organizer_id,
          ce.pre_buffer_minutes, ce.post_buffer_minutes, ce.reminder_minutes,
          ce.tags, COALESCE(ce.meta, '{}'::jsonb) AS meta,
          COALESCE(ce.conflict_flags, '[]'::jsonb) AS conflict_flags,
          COALESCE(ce.coverage_warnings, '[]'::jsonb) AS coverage_warnings,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', ca.id,
                'attendee_type', ca.attendee_type,
                'attendee_id', ca.attendee_id,
                'attendee_name', ca.attendee_name,
                'attendee_email', ca.attendee_email,
                'response_status', ca.response_status,
                'response_timestamp', ca.response_timestamp
              )
            ) FROM calendar_attendees ca WHERE ca.event_id = ce.id), 
            '[]'::json
          ) as attendees
        FROM calendar_events ce
        ORDER BY ce.start_time ASC LIMIT 500
      `
    }
    
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST create
export async function POST(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      type,
      start_time,
      end_time,
      all_day = false,
      description,
      location,
      timezone = "UTC",
      organizer_id,
      pre_buffer_minutes = 0,
      post_buffer_minutes = 0,
      reminder_minutes = 30,
      tags = [],
      meta = {},
      attendees = [],
      generate_google_meet = false
    } = body

    if (!title || !type || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the calendar event
    const [event] = await sql`
      INSERT INTO calendar_events (
        title, type, start_time, end_time, all_day, description, location,
        timezone, organizer_id, pre_buffer_minutes, post_buffer_minutes,
        reminder_minutes, tags, meta, created_by, status
      ) VALUES (
        ${title}, ${type}, ${start_time}::timestamptz, ${end_time}::timestamptz,
        ${all_day}, ${description || null}, ${location || null},
        ${timezone}, ${organizer_id || session.user?.email}, ${pre_buffer_minutes},
        ${post_buffer_minutes}, ${reminder_minutes}, ${tags}, ${meta},
        ${session.user?.email}, 'scheduled'
      ) RETURNING id
    `

    const eventId = event.id

    // Add attendees
    if (attendees && attendees.length > 0) {
      for (const attendee of attendees) {
        await sql`
          INSERT INTO calendar_attendees (
            event_id, attendee_type, attendee_id, attendee_name, attendee_email
          ) VALUES (
            ${eventId}, ${attendee.attendee_type}, ${attendee.attendee_id || null},
            ${attendee.attendee_name}, ${attendee.attendee_email}
          )
        `
      }
    }

    // Add audit trail entry
    await sql`
      INSERT INTO calendar_audit_trail (
        event_id, actor_id, actor_name, action, after_state
      ) VALUES (
        ${eventId}, ${session.user?.email}, ${session.user?.name || session.user?.email},
        'created', ${JSON.stringify({ title, type, start_time, end_time, attendees })}
      )
    `

    // Generate Google Meet link if requested
    let googleMeetUrl = null
    if (generate_google_meet && type === "interview") {
      try {
        const meetResponse = await fetch("/api/calendar/google-meet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            start_time,
            end_time,
            attendees: attendees.map((a: any) => a.attendee_email)
          }),
        })
        
        if (meetResponse.ok) {
          const meetData = await meetResponse.json()
          googleMeetUrl = meetData.meetLink
          
          // Update event with Google Meet URL
          await sql`
            UPDATE calendar_events 
            SET google_meet_url = ${googleMeetUrl}
            WHERE id = ${eventId}
          `
        }
      } catch (error) {
        console.error("Failed to generate Google Meet link:", error)
      }
    }

    // Check for conflicts
    const attendeeEmails = attendees.map((a: any) => a.attendee_email)
    if (attendeeEmails.length > 0) {
      const conflicts = await sql`
        SELECT * FROM check_calendar_conflicts(
          ${start_time}::timestamptz,
          ${end_time}::timestamptz,
          ${attendeeEmails}::text[],
          ${eventId}
        )
      `

      if (conflicts.length > 0) {
        for (const conflict of conflicts) {
          await sql`
            INSERT INTO calendar_conflicts (
              event_id, conflicting_event_id, conflict_type, severity, description
            ) VALUES (
              ${eventId}, ${conflict.conflicting_event_id}, ${conflict.conflict_type},
              ${conflict.severity}, ${conflict.description}
            )
          `
        }
      }
    }

    return NextResponse.json({ id: eventId, success: true, google_meet_url: googleMeetUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT update
export async function PUT(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    // Get current event state for audit trail
    const [currentEvent] = await sql`
      SELECT * FROM calendar_events WHERE id = ${id}
    `

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update the event
    const [updatedEvent] = await sql`
      UPDATE calendar_events 
      SET 
        title = COALESCE(${updateData.title}, title),
        start_time = COALESCE(${updateData.start_time}::timestamptz, start_time),
        end_time = COALESCE(${updateData.end_time}::timestamptz, end_time),
        description = COALESCE(${updateData.description}, description),
        location = COALESCE(${updateData.location}, location),
        status = COALESCE(${updateData.status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // Add audit trail entry
    await sql`
      INSERT INTO calendar_audit_trail (
        event_id, actor_id, actor_name, action, before_state, after_state
      ) VALUES (
        ${id}, ${session.user.email}, ${session.user.name || session.user.email},
        'updated', ${JSON.stringify(currentEvent)}, ${JSON.stringify(updatedEvent)}
      )
    `

    return NextResponse.json({ success: true, event: updatedEvent })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE event
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
      return NextResponse.json({ error: "Event ID required" }, { status: 400 })
    }

    // Get current event state for audit trail
    const [currentEvent] = await sql`
      SELECT * FROM calendar_events WHERE id = ${id}
    `

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Soft delete by setting status to cancelled
    await sql`
      UPDATE calendar_events 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id}
    `

    // Add audit trail entry
    await sql`
      INSERT INTO calendar_audit_trail (
        event_id, actor_id, actor_name, action, before_state
      ) VALUES (
        ${id}, ${session.user.email}, ${session.user.name || session.user.email},
        'cancelled', ${JSON.stringify(currentEvent)}
      )
    `

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
