import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

// PUT /api/calendar/events/[id] - Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
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
      googleMeetLink
    } = body

    // Get current event state for audit trail
    const [currentEvent] = await sql`
      SELECT * FROM calendar_events WHERE id = ${eventId}
    `

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Update the event
    const [updatedEvent] = await sql`
      UPDATE calendar_events 
      SET 
        title = COALESCE(${title}, title),
        type = COALESCE(${type}, type),
        start_time = COALESCE(${start_time}::timestamptz, start_time),
        end_time = COALESCE(${end_time}::timestamptz, end_time),
        all_day = COALESCE(${all_day}, all_day),
        description = COALESCE(${description}, description),
        location = COALESCE(${location}, location),
        timezone = COALESCE(${timezone}, timezone),
        organizer_id = COALESCE(${organizer_id}, organizer_id),
        pre_buffer_minutes = COALESCE(${pre_buffer_minutes}, pre_buffer_minutes),
        post_buffer_minutes = COALESCE(${post_buffer_minutes}, post_buffer_minutes),
        reminder_minutes = COALESCE(${reminder_minutes}, reminder_minutes),
        tags = COALESCE(${tags}, tags),
        meta = COALESCE(${meta}, meta),
        google_meet_url = COALESCE(${googleMeetLink}, google_meet_url),
        updated_at = NOW()
      WHERE id = ${eventId}
      RETURNING *
    `

    // Update attendees if provided
    if (attendees && attendees.length > 0) {
      // Remove existing attendees
      await sql`
        DELETE FROM calendar_attendees WHERE event_id = ${eventId}
      `

      // Add new attendees
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
        event_id, actor_id, actor_name, action, before_state, after_state
      ) VALUES (
        ${eventId}, ${session.user.email}, ${session.user.name || session.user.email},
        'updated', ${JSON.stringify(currentEvent)}, ${JSON.stringify(updatedEvent)}
      )
    `

    // Get updated event with attendees
    const [finalEvent] = await sql`
      SELECT 
        ce.*,
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
      WHERE ce.id = ${eventId}
    `

    return NextResponse.json({ success: true, event: finalEvent })
  } catch (e: any) {
    console.error("Error updating event:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/calendar/events/[id] - Delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    // Get current event state for audit trail
    const [currentEvent] = await sql`
      SELECT * FROM calendar_events WHERE id = ${eventId}
    `

    if (!currentEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Soft delete by setting status to cancelled
    await sql`
      UPDATE calendar_events 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${eventId}
    `

    // Add audit trail entry
    await sql`
      INSERT INTO calendar_audit_trail (
        event_id, actor_id, actor_name, action, before_state
      ) VALUES (
        ${eventId}, ${session.user.email}, ${session.user.name || session.user.email},
        'cancelled', ${JSON.stringify(currentEvent)}
      )
    `

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("Error deleting event:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/calendar/events/[id] - Get single event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const [event] = await sql`
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
      WHERE ce.id = ${eventId}
    `

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (e: any) {
    console.error("Error fetching event:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
