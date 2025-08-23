type EmailRenderParams = {
  title: string
  type: string
  description?: string
  location?: string
  startISO: string
  endISO: string
  videoLink?: string
  googleMeetLink?: string
  message?: string
  attendees?: string[]
}

export function renderEventEmailHTML(p: EmailRenderParams) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })

  const formatDuration = (startISO: string, endISO: string) => {
    const start = new Date(startISO)
    const end = new Date(endISO)
    const durationMs = end.getTime() - start.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    }
    return `${minutes}m`
  }

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'interview': return '#3b82f6'
      case 'pto': return '#f59e0b'
      case 'holiday': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Invitation</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${getEventTypeColor(p.type)} 0%, ${getEventTypeColor(p.type)}dd 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${escapeHtml(p.title)}</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(p.type)}</p>
      </div>

      <!-- Event Details -->
      <div style="padding: 32px;">
        <!-- Date & Time -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: ${getEventTypeColor(p.type)}; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Event Details</h2>
          </div>
          <div style="margin-left: 32px;">
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
              <strong>📅 Date:</strong> ${fmt(p.startISO).split(',')[0]}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
              <strong>🕐 Time:</strong> ${fmt(p.startISO).split(',')[1]} - ${fmt(p.endISO).split(',')[1]}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
              <strong>⏱️ Duration:</strong> ${formatDuration(p.startISO, p.endISO)}
            </p>
          </div>
        </div>

        <!-- Location -->
        ${p.location ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: #10b981; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Location</h2>
          </div>
          <div style="margin-left: 32px;">
            <p style="margin: 0; font-size: 16px; color: #374151;">${escapeHtml(p.location)}</p>
          </div>
        </div>
        ` : ''}

        <!-- Video Links -->
        ${(p.videoLink || p.googleMeetLink) ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: #8b5cf6; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Video Conference</h2>
          </div>
          <div style="margin-left: 32px;">
            ${p.googleMeetLink ? `
            <div style="margin-bottom: 12px;">
              <a href="${escapeAttr(p.googleMeetLink)}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 8px;">
                🎥 Join Google Meet
              </a>
            </div>
            ` : ''}
            ${p.videoLink ? `
            <div style="margin-bottom: 12px;">
              <a href="${escapeAttr(p.videoLink)}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                📹 Join Video Call
              </a>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Description -->
        ${p.description ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: #f59e0b; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Description</h2>
          </div>
          <div style="margin-left: 32px;">
            <p style="margin: 0; font-size: 16px; color: #374151; white-space: pre-line;">${escapeHtml(p.description)}</p>
          </div>
        </div>
        ` : ''}

        <!-- Attendees -->
        ${p.attendees && p.attendees.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: #ec4899; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Attendees</h2>
          </div>
          <div style="margin-left: 32px;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${p.attendees.map(attendee => `
                <span style="background-color: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
                  ${escapeHtml(attendee)}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Additional Message -->
        ${p.message ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background-color: #6b7280; border-radius: 50%; margin-right: 12px;"></div>
            <h2 style="margin: 0; font-size: 18px; color: #1f2937;">Additional Information</h2>
          </div>
          <div style="margin-left: 32px;">
            <p style="margin: 0; font-size: 16px; color: #374151; white-space: pre-line;">${escapeHtml(p.message)}</p>
          </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            This invitation was sent from Joyride HR Calendar System
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            You can add this event to your calendar using the attached .ics file
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;")
}