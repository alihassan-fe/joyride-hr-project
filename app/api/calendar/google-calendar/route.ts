import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

// Initialize Google Calendar API
function getGoogleCalendarAPI() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return google.calendar({ version: 'v3', auth })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, action = "create", title, description, start, end, location, attendees } = body

    // Check if Google Calendar credentials are configured
    if (!process.env.GOOGLE_CALENDAR_CLIENT_EMAIL || !process.env.GOOGLE_CALENDAR_PRIVATE_KEY) {
      console.log("⚠️ Google Calendar credentials not configured, using simulation")
      return simulateGoogleCalendarResponse(event_id, action, title, description, start, end, location, attendees)
    }

    try {
      const calendar = getGoogleCalendarAPI()
      
      if (action === "create") {
        const event = {
          summary: title,
          description: description,
          location: location,
          start: {
            dateTime: start,
            timeZone: 'UTC',
          },
          end: {
            dateTime: end,
            timeZone: 'UTC',
          },
          attendees: attendees?.map((email: string) => ({ email })) || [],
          conferenceData: {
            createRequest: {
              requestId: `meet_${event_id}_${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          }
        }

        console.log("📅 Creating Google Calendar event...")
        
        const response = await calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
          requestBody: event,
          conferenceDataVersion: 1,
          sendUpdates: 'all', // Send invites to attendees
        })

        console.log("✅ Google Calendar event created:", response.data.id)
        
        return NextResponse.json({
          success: true,
          calendarId: response.data.id,
          message: "Event created in Google Calendar",
          event: response.data,
          isReal: true
        })

      } else if (action === "update") {
        // Update existing event
        const event = {
          summary: title,
          description: description,
          location: location,
          start: {
            dateTime: start,
            timeZone: 'UTC',
          },
          end: {
            dateTime: end,
            timeZone: 'UTC',
          },
          attendees: attendees?.map((email: string) => ({ email })) || [],
        }

        console.log("📅 Updating Google Calendar event...")
        
        const response = await calendar.events.update({
          calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
          eventId: event_id,
          requestBody: event,
          sendUpdates: 'all',
        })

        console.log("✅ Google Calendar event updated:", response.data.id)
        
        return NextResponse.json({
          success: true,
          calendarId: response.data.id,
          message: "Event updated in Google Calendar",
          event: response.data,
          isReal: true
        })

      } else if (action === "delete") {
        // Delete event
        console.log("📅 Deleting Google Calendar event...")
        
        await calendar.events.delete({
          calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
          eventId: event_id,
          sendUpdates: 'all',
        })

        console.log("✅ Google Calendar event deleted")
        
        return NextResponse.json({
          success: true,
          message: "Event deleted from Google Calendar",
          isReal: true
        })
      }

    } catch (googleError) {
      console.error("❌ Google Calendar API error:", googleError)
      console.log("🔄 Falling back to simulation")
      return simulateGoogleCalendarResponse(event_id, action, title, description, start, end, location, attendees)
    }

  } catch (error) {
    console.error("Google Calendar integration error:", error)
    return NextResponse.json({ 
      error: "Failed to sync with Google Calendar",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Simulation function for when Google Calendar API is not configured
function simulateGoogleCalendarResponse(event_id: string, action: string, title: string, description: string, start: string, end: string, location: string, attendees: string[]) {
  const googleCalendarEventId = `google_cal_${event_id}_${Date.now()}`
  
  const calendarEvent = {
    id: googleCalendarEventId,
    htmlLink: `https://calendar.google.com/event?eid=${googleCalendarEventId}`,
    status: "confirmed",
    summary: title,
    description: description,
    start: { dateTime: start, timeZone: 'UTC' },
    end: { dateTime: end, timeZone: 'UTC' },
    location: location,
    attendees: attendees?.map((email: string) => ({ email, responseStatus: 'needsAction' })) || []
  }

  return NextResponse.json({
    success: true,
    calendarId: googleCalendarEventId,
    message: `Event ${action === "create" ? "created" : action === "update" ? "updated" : "deleted"} in Google Calendar (simulated)`,
    event: calendarEvent,
    isReal: false
  })
}
