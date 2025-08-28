import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET(req: NextRequest) {
  const sql = getSql()
  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employee_id')

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 })
    }

    const meetings = await sql/* sql */`
      SELECT 
        em.id, em.employee_id, em.meeting_type, em.title, em.description,
        em.scheduled_date, em.duration_minutes, em.location, em.google_meet_url,
        em.notes, em.status, em.created_by, em.created_at, em.updated_at,
        -- Creator information
        c.name as creator_name
      FROM employee_meetings em
      LEFT JOIN employees c ON em.created_by = c.id
      WHERE em.employee_id = ${employeeId}
      ORDER BY em.scheduled_date DESC
    `

    return NextResponse.json({ data: meetings })
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = getSql()
  try {
    const body = await req.json()

    const { 
      employee_id, 
      meeting_type, 
      title, 
      description, 
      scheduled_date, 
      scheduled_time,
      duration_minutes, 
      location, 
      generate_google_meet,
      notes,
      created_by 
    } = body

    if (!employee_id || !meeting_type || !title || !scheduled_date) {
      return NextResponse.json({ 
        error: "Employee ID, meeting type, title, and date are required" 
      }, { status: 400 })
    }

    // Handle the scheduled date - if it's already a full ISO string, use it directly
    let scheduledDateTime
    if (scheduled_date.includes('T')) {
      // It's already a full ISO string
      scheduledDateTime = scheduled_date
    } else {
      // Combine date and time into a single datetime
      scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`).toISOString()
    }

    // Generate Google Meet URL if requested
    let googleMeetUrl = location
    if (generate_google_meet && !location?.includes('meet.google.com')) {
      // Generate a simple Google Meet URL (in a real app, you'd use Google Calendar API)
      const meetId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      googleMeetUrl = `https://meet.google.com/${meetId}`
    }

    const [meeting] = await sql/* sql */`
      INSERT INTO employee_meetings (
        employee_id, meeting_type, title, description, scheduled_date, 
        duration_minutes, location, google_meet_url, notes, created_by, status
      )
      VALUES (
        ${employee_id}, ${meeting_type}, ${title}, ${description || null}, 
        ${scheduledDateTime}, ${duration_minutes || 60}, ${location || null}, 
        ${googleMeetUrl || null}, ${notes || null}, ${created_by || null}, 'Scheduled'
      )
      RETURNING 
        id, employee_id, meeting_type, title, description, scheduled_date,
        duration_minutes, location, google_meet_url, notes, status, created_by,
        created_at, updated_at
    `

    // Log the activity (this will also be triggered automatically, but we log it here too for API tracking)
    try {
      await sql/* sql */`
        SELECT log_activity_from_api(
          ${employee_id}::uuid,
          ${created_by || employee_id}::uuid,
          'meeting_scheduled'::text,
          jsonb_build_object(
            'meeting_title', ${title},
            'meeting_type', ${meeting_type},
            'scheduled_date', ${scheduledDateTime},
            'duration', ${duration_minutes || 60},
            'location', ${location || 'Not specified'}
          )
        )
      `
    } catch (logError) {
      console.error("Error logging activity:", logError)
      // Don't fail the entire request if activity logging fails
    }

    return NextResponse.json({ data: meeting })
  } catch (error) {
    console.error("Error creating meeting:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}
