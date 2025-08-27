import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET /api/calendar/free-busy - Check availability for multiple attendees
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start_date = searchParams.get("start_date")
  const end_date = searchParams.get("end_date")
  const attendee_emails = searchParams.get("attendee_emails")
  const duration_minutes = searchParams.get("duration_minutes") || "60"
  
  if (!start_date || !end_date || !attendee_emails) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const emails = attendee_emails.split(",").map(email => email.trim())
    const duration = parseInt(duration_minutes)
    
    // Get business hours
    const businessHours = await sql`
      SELECT day_of_week, start_time, end_time, is_working_day
      FROM business_hours
      ORDER BY day_of_week
    `

    // Get existing events for all attendees
    const existingEvents = await sql`
      SELECT 
        ce.id, ce.title, ce.type, ce.start_time, ce.end_time, ce.all_day,
        ca.attendee_email, ca.attendee_name
      FROM calendar_events ce
      JOIN calendar_attendees ca ON ce.id = ca.event_id
      WHERE ca.attendee_email = ANY(${emails}::text[])
      AND ce.status NOT IN ('cancelled', 'denied')
      AND (
        (ce.start_time >= ${start_date}::date AND ce.start_time < ${end_date}::date + interval '1 day') OR
        (ce.end_time > ${start_date}::date AND ce.end_time <= ${end_date}::date + interval '1 day') OR
        (ce.start_time <= ${start_date}::date AND ce.end_time >= ${end_date}::date + interval '1 day')
      )
      ORDER BY ce.start_time
    `

    // Generate time slots for the date range
    const slots = generateTimeSlots(start_date, end_date, duration, businessHours)
    
    // Check availability for each slot
    const availability = checkSlotAvailability(slots, existingEvents, emails)
    
    // Group by attendee
    const attendeeAvailability = emails.map(email => {
      const attendeeEvents = existingEvents.filter(event => event.attendee_email === email)
      const attendeeSlots = availability.map(slot => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        available: slot.available_attendees.includes(email),
        conflict_reason: slot.available_attendees.includes(email) ? null : 
          slot.conflicts.find(c => c.attendee_email === email)?.title || "Busy"
      }))

      return {
        attendee_email: email,
        attendee_name: attendeeEvents[0]?.attendee_name || email.split('@')[0],
        slots: attendeeSlots
      }
    })

    return NextResponse.json(attendeeAvailability)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Helper function to generate time slots
function generateTimeSlots(startDate: string, endDate: string, durationMinutes: number, businessHours: any[]) {
  const slots = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay()
    const dayHours = businessHours.find(bh => bh.day_of_week === dayOfWeek)
    
    if (!dayHours || !dayHours.is_working_day) continue
    
    const [startHour, startMinute] = dayHours.start_time.split(':').map(Number)
    const [endHour, endMinute] = dayHours.end_time.split(':').map(Number)
    
    const slotStart = new Date(date)
    slotStart.setHours(startHour, startMinute, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(endHour, endMinute, 0, 0)
    
    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)
      if (slotEnd <= dayEnd) {
        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString()
        })
      }
      slotStart.setMinutes(slotStart.getMinutes() + 30) // 30-minute intervals
    }
  }
  
  return slots
}

// Helper function to check slot availability
function checkSlotAvailability(slots: any[], events: any[], attendeeEmails: string[]) {
  return slots.map(slot => {
    const slotStart = new Date(slot.start_time)
    const slotEnd = new Date(slot.end_time)
    
    const conflicts = events.filter(event => {
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
      
      return (
        (slotStart < eventEnd && slotEnd > eventStart) ||
        (eventStart < slotEnd && eventEnd > slotStart)
      )
    })
    
    const busyAttendees = new Set(conflicts.map(event => event.attendee_email))
    const availableAttendees = attendeeEmails.filter(email => !busyAttendees.has(email))
    
    return {
      ...slot,
      available_attendees: availableAttendees,
      conflicts: conflicts
    }
  })
}
