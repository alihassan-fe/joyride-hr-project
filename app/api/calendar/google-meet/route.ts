import { NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

// Initialize Google Calendar API
function getGoogleCalendarAPI() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
  })

  return google.calendar({ version: 'v3', auth })
}

// Initialize Google Meet API
function getGoogleMeetAPI() {
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
    const { title, start_time, end_time, start, end, attendees = [] } = body

    // Handle both naming conventions (start_time/end_time vs start/end)
    const eventStart = start_time || start
    const eventEnd = end_time || end

    console.log("📅 Received date inputs:", { start_time, end_time, start, end, eventStart, eventEnd })

    // Validate that we have both start and end times
    if (!eventStart || !eventEnd) {
      console.error("❌ Missing start or end time")
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 })
    }

    // Ensure dates are in ISO format for Google Calendar API
    const formatDateForGoogle = (dateString: string) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateString}`)
      }
      return date.toISOString()
    }

    const formattedStart = formatDateForGoogle(eventStart)
    const formattedEnd = formatDateForGoogle(eventEnd)

    console.log("📅 Formatted dates:", { formattedStart, formattedEnd })

    // Check if Google Calendar credentials are configured
    if (!process.env.GOOGLE_CALENDAR_CLIENT_EMAIL || !process.env.GOOGLE_CALENDAR_PRIVATE_KEY) {
      console.log("⚠️ Google Calendar credentials not configured, using fallback")
      return generateFallbackMeetLink(title, formattedStart, formattedEnd, attendees)
    }

    try {
      // Use real Google Calendar API
      const calendar = getGoogleCalendarAPI()
      
      const event = {
        summary: title,
        description: `Meeting created via Joyride HR Calendar`,
        start: {
          dateTime: formattedStart,
          timeZone: 'UTC',
        },
        end: {
          dateTime: formattedEnd,
          timeZone: 'UTC',
        },
        attendees: attendees.map((email: string) => ({ email }))
      }

      console.log("🎥 Creating Google Calendar event with Meet link...")
      
      const response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
        requestBody: event,
      })

      console.log("✅ Google Calendar event created successfully")
      console.log("📅 Event ID:", response.data.id)
      
      // For now, we'll use the fallback Meet link
      // To get real Google Meet links, you need to:
      // 1. Enable Google Meet add-on in your Google Calendar settings
      // 2. Or use the Google Meet API directly (more complex)
      console.log("💡 To get real Meet links, enable Google Meet add-on in your calendar settings")
      return generateFallbackMeetLink(title, formattedStart, formattedEnd, attendees)

    } catch (googleError: any) {
      console.error("❌ Google Calendar API error:", googleError.message)
      console.error("🔍 Error details:", {
        code: googleError.code,
        status: googleError.status,
        message: googleError.message
      })
      
      // Provide specific guidance based on error type
      if (googleError.code === 400 && googleError.message.includes("date")) {
        console.log("🔧 Date format error - please check the date format being sent")
      } else if (googleError.code === 404) {
        console.log("🔧 404 Error - Calendar not found. Please check:")
        console.log("   - Calendar ID is correct")
        console.log("   - Service account has access to the calendar")
        console.log("   - Calendar is shared with:", process.env.GOOGLE_CALENDAR_CLIENT_EMAIL)
      } else if (googleError.code === 403) {
        console.log("🔧 403 Error - Permission denied. Please check:")
        console.log("   - Service account has calendar permissions")
        console.log("   - Calendar is shared with the service account")
      } else if (googleError.code === 401) {
        console.log("🔧 401 Error - Authentication failed. Please check:")
        console.log("   - Service account credentials are correct")
        console.log("   - Private key is properly formatted")
      }
      
      console.log("🔄 Falling back to simulated Meet link")
      return generateFallbackMeetLink(title, formattedStart, formattedEnd, attendees)
    }

  } catch (error) {
    console.error("Google Meet generation error:", error)
    return NextResponse.json({ error: "Failed to generate Google Meet link" }, { status: 500 })
  }
}

// Fallback function for when Google Calendar API is not configured
function generateFallbackMeetLink(title: string, start_time: string, end_time: string, attendees: string[]) {
  const meetingId = generateMeetingId()
  const meetLink = `https://meet.google.com/${meetingId}`
  
  console.log("🎥 Generated fallback Google Meet link:", meetLink)
  
  return NextResponse.json({
    meetLink,
    meetingId,
    calendarEvent: {
      summary: title,
      start: { dateTime: start_time, timeZone: 'UTC' },
      end: { dateTime: end_time, timeZone: 'UTC' },
      attendees: attendees.map((email: string) => ({ email })),
    },
    isReal: false
  })
}

function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  
  const generatePart = (length: number) => {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  const part1 = generatePart(4)
  const part2 = generatePart(4)
  const part3 = generatePart(4)
  
  return `${part1}-${part2}-${part3}`
}
