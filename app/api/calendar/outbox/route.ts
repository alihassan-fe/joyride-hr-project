import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET last 50 notifications with payload (for HTML preview/ICS download)
export async function GET() {
  try {
    const rows = await sql`
      SELECT n.id, n.event_id, n.channel, n.subject, n.recipients, n.status, n.created_at,
             e.title AS event_title,
             n.payload
      FROM event_notifications n
      LEFT JOIN calendar_events e ON e.id = n.event_id
      ORDER BY n.created_at DESC
      LIMIT 50
    `
    return NextResponse.json(
      rows.map((r: any) => ({
        ...r,
        recipients: r.recipients || [],
        payload: r.payload || {},
      })),
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
