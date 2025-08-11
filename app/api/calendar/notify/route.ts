import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { renderEventEmailHTML } from "@/lib/email"
import { createEventICS } from "@/lib/ics"
import { sendEventEmail } from "@/lib/mailer"

export async function POST(req: Request) {
  try {
    const { event_id, recipients: overrideRecipients, subject: subjectOverride, message } = await req.json()

    if (!event_id) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 })
    }

    const rows = await sql<
      {
        id: number
        title: string
        type: string
        description: string | null
        location: string | null
        start_time: string
        end_time: string
        meta: any
      }[]
    >`
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
    const recipients: string[] = Array.from(new Set([...(overrideRecipients || []), ...autoRecipients]))
      .filter(Boolean)
      .map((e) => String(e).trim())

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    const subject =
      subjectOverride || (event.type === "interview" ? `Interview: ${event.title}` : `Invitation: ${event.title}`)

    const html = renderEventEmailHTML({
      title: event.title,
      type: event.type,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startISO: event.start_time,
      endISO: event.end_time,
      videoLink: meta.videoLink,
      message,
    })

    const ics = createEventICS({
      uid: `event-${event.id}@joyride-hr`,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startISO: event.start_time,
      endISO: event.end_time,
      organizer: process.env.MAIL_FROM || "hr@company.test",
      attendees: recipients,
    })

    // 1) Queue in Outbox first
    const queued = await sql<
      {
        id: number
        status: string
      }[]
    >`
      INSERT INTO event_notifications (event_id, channel, subject, recipients, payload, status)
      VALUES (${event.id}, 'email', ${subject}, ${recipients}, ${{
        html,
        ics,
        event,
      }}, 'queued')
      RETURNING id, status
    `
    const notificationId = queued[0].id

    // 2) Try to send email via provider (Resend or SMTP), otherwise remain queued
    let providerMsgId: string | null = null
    let newStatus: "sent" | "failed" | "queued" = "queued"
    let errorMsg: string | null = null

    try {
      const result = await sendEventEmail({
        to: recipients,
        subject,
        html,
        ics,
      })

      if (result.provider === "noop") {
        newStatus = "queued" // No provider configured; stays queued for visibility
      } else {
        providerMsgId = result.id
        newStatus = "sent"
      }
    } catch (err: any) {
      newStatus = "failed"
      errorMsg = err?.message || String(err)
    }

    // 3) Update Outbox row with result
    await sql`
      UPDATE event_notifications
      SET status = ${newStatus},
          message_id = ${providerMsgId},
          error = ${errorMsg},
          sent_at = CASE WHEN ${newStatus} = 'sent' THEN now() ELSE sent_at END
      WHERE id = ${notificationId}
    `

    return NextResponse.json(
      {
        ok: true,
        notification: {
          id: notificationId,
          status: newStatus,
          message_id: providerMsgId,
          error: errorMsg,
        },
      },
      { status: 201 },
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
