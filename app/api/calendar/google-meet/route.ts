import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, start_time, end_time, attendees = [] } = body

    // Generate a unique meeting ID
    const meetingId = generateMeetingId()
    
    // Create Google Meet link
    const meetLink = `https://meet.google.com/${meetingId}`
    
    // Create calendar event data for Google Calendar integration
    const calendarEvent = {
      summary: title,
      start: {
        dateTime: start_time,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end_time,
        timeZone: 'UTC'
      },
      attendees: attendees.map((email: string) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: meetingId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    }

    return NextResponse.json({
      meetLink,
      meetingId,
      calendarEvent
    })
  } catch (error) {
    console.error("Google Meet generation error:", error)
    return NextResponse.json({ error: "Failed to generate Google Meet link" }, { status: 500 })
  }
}

function generateMeetingId(): string {
  // Generate a 3-part meeting ID like Google Meet format
  const part1 = Math.random().toString(36).substring(2, 6)
  const part2 = Math.random().toString(36).substring(2, 6)
  const part3 = Math.random().toString(36).substring(2, 6)
  return `${part1}-${part2}-${part3}`
}
