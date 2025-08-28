import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

// POST /api/calendar/interviews - Create interview event
export async function POST(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      candidate_id,
      interviewers,
      date,
      start_time,
      end_time,
      location = "None",
      interview_type = "video",
      notes,
      generate_google_meet = false,
      pre_buffer_minutes = 15,
      post_buffer_minutes = 15
    } = body

    if (!candidate_id || !interviewers || !date || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get candidate information
    const [candidate] = await sql`
      SELECT id, name, email FROM candidates WHERE id = ${candidate_id}
    `

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Get interviewer information
    const interviewerEmails = []
    const attendees = []

    for (const interviewerId of interviewers) {
      const [interviewer] = await sql`
        SELECT id, name, email FROM employees WHERE id = ${interviewerId}
      `
      if (interviewer) {
        interviewerEmails.push(interviewer.email)
        attendees.push({
          attendee_type: 'employee',
          attendee_id: interviewer.id,
          attendee_name: interviewer.name,
          attendee_email: interviewer.email
        })
      }
    }

    if (attendees.length === 0) {
      return NextResponse.json({ error: "No valid interviewers found" }, { status: 400 })
    }

    // Add candidate as attendee
    attendees.push({
      attendee_type: 'candidate',
      attendee_id: candidate.id,
      attendee_name: candidate.name,
      attendee_email: candidate.email
    })

    // Create title and description
    const title = `Interview: ${candidate.name}`
    const description = notes || `Interview for ${candidate.name}`
    
    // Combine date and time
    const startDateTime = `${date}T${start_time}:00Z`
    const endDateTime = `${date}T${end_time}:00Z`

    // Create the calendar event
    const [event] = await sql`
      INSERT INTO calendar_events (
        title, type, start_time, end_time, all_day, description, location,
        timezone, organizer_id, pre_buffer_minutes, post_buffer_minutes,
        reminder_minutes, tags, meta, created_by, status
      ) VALUES (
        ${title}, 'interview', ${startDateTime}::timestamptz, ${endDateTime}::timestamptz,
        false, ${description}, ${location},
        'UTC', ${session.user?.email}, ${pre_buffer_minutes},
        ${post_buffer_minutes}, 30, ${['interview']}, ${JSON.stringify({ candidate_id, interview_type })},
        ${session.user?.email}, 'scheduled'
      ) RETURNING id
    `

    const eventId = event.id

    // Add attendees
    for (const attendee of attendees) {
      await sql`
        INSERT INTO calendar_attendees (
          event_id, attendee_type, attendee_id, attendee_name, attendee_email
        ) VALUES (
          ${eventId}, ${attendee.attendee_type}, ${attendee.attendee_id},
          ${attendee.attendee_name}, ${attendee.attendee_email}
        )
      `
    }

    // Add audit trail entry
    await sql`
      INSERT INTO calendar_audit_trail (
        event_id, actor_id, actor_name, action, after_state
      ) VALUES (
        ${eventId}, ${session.user?.email}, ${session.user?.name || session.user?.email},
        'created', ${JSON.stringify({ candidate_id, interviewers, date, start_time, end_time, interview_type })}
      )
    `

    // Generate Google Meet link if requested
    let googleMeetUrl = null
    if (generate_google_meet && interview_type === "video") {
      try {
        const meetResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/google-meet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            start_time: startDateTime,
            end_time: endDateTime,
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

    return NextResponse.json({ 
      id: eventId, 
      success: true, 
      google_meet_url: googleMeetUrl,
      event: {
        id: eventId,
        title,
        type: 'interview',
        start_time: startDateTime,
        end_time: endDateTime,
        attendees
      }
    })
  } catch (e: any) {
    console.error("Error creating interview:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/calendar/interviews - Get all interviews
export async function GET(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const candidate_id = searchParams.get("candidate_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    let query = sql`
      SELECT 
        ce.id, ce.title, ce.type, ce.start_time, ce.end_time, ce.description, 
        ce.location, ce.google_meet_url, ce.meta, ce.created_at,
        json_agg(
          json_build_object(
            'attendee_type', ca.attendee_type,
            'attendee_id', ca.attendee_id,
            'attendee_name', ca.attendee_name,
            'attendee_email', ca.attendee_email
          )
        ) as attendees
      FROM calendar_events ce
      LEFT JOIN calendar_attendees ca ON ce.id = ca.event_id
      WHERE ce.type = 'interview'
    `

    if (candidate_id) {
      query = sql`${query} AND ce.meta->>'candidate_id' = ${candidate_id}`
    }

    if (start_date && end_date) {
      query = sql`${query} AND ce.start_time >= ${start_date}::timestamptz AND ce.end_time <= ${end_date}::timestamptz`
    }

    query = sql`${query} GROUP BY ce.id ORDER BY ce.start_time DESC`

    const rows = await query

    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    console.error("Error fetching interviews:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
