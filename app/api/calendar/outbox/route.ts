import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100)

    const rows = await sql<
      {
        id: number
        event_id: number
        channel: string
        subject: string
        recipients: string[]
        status: string
        created_at: string
        payload: any
        message_id: string | null
        error: string | null
        event_title: string
      }[]
    >`
      SELECT en.id,
             en.event_id,
             en.channel,
             en.subject,
             en.recipients,
             en.status,
             to_char(en.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             en.payload,
             en.message_id,
             en.error,
             ce.title as event_title
      FROM event_notifications en
      JOIN calendar_events ce ON ce.id = en.event_id
      ORDER BY en.created_at DESC
      LIMIT ${limit}
    `
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
