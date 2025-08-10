import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { renderEventEmailHTML } from "@/lib/email"
import { createEventICS } from "@/lib/ics"

export async function POST(req: Request) {
  try {
    const { event_id, recipients: overrideRecipients, subject: subjectOverride, message } = await req.json()

    if (!event_id) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 })
    }

    const rows = await sql`
      SELECT id, title, type, description, location,
             to_char(start_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
             to_char(end_time   AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
             COALESCE(meta,'{}'::jsonb) as meta
      FROM calendar_events
      WHERE id = ${event_id}
      LIMIT 1
    `
    const event = rows[0]
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const meta = event.meta || {}
    const autoRecipients: string[] = [
      ...(Array.isArray(meta.attendees) ? meta.attendees : []),
      ...(meta.candidateEmail ? [meta.candidateEmail] : []),
      ...(Array.isArray(meta.panelEmails) ? meta.panelEmails : []),
    ]
    const recipients: string[] = Array.from(new Set([...(overrideRecipients || []), ...autoRecipients])).filter(Boolean)

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    const subject =
      subjectOverride || (event.type === "interview" ? `Interview: ${event.title}` : `Invitation: ${event.title}`)

    const html = renderEventEmailHTML({
      title: event.title,
      type: event.type,
      description: event.description,
      location: event.location,
      startISO: event.start_time,
      endISO: event.end_time,
      videoLink: meta.videoLink,
      message,
    })

    const ics = createEventICS({
      uid: `event-${event.id}@joyride-hr`,
      title: event.title,
      description: event.description,
      location: event.location,
      startISO: event.start_time,
      endISO: event.end_time,
      organizer: "hr@company.test",
      attendees: recipients,
    })

    const inserted = await sql`
      INSERT INTO event_notifications (event_id, channel, subject, recipients, payload, status)
      VALUES (${event.id}, 'email', ${subject}, ${recipients}, ${{
        html,
        ics,
        event,
      }}, 'queued')
      RETURNING id, event_id, channel, subject, recipients, status, created_at
    `

    // NOTE: This only queues/logs. To send for real, integrate an email provider here.

    return NextResponse.json({ ok: true, notification: inserted[0] }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
