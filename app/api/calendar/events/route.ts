import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// GET /api/calendar/events?start=ISO&end=ISO
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  try {
    let rows
    if (start && end) {
      rows = await sql`
        SELECT id, title, type,
               to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
               to_char(end_time   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
               all_day, created_by,
               description, location, COALESCE(meta, '{}'::jsonb) AS meta
        FROM calendar_events
        WHERE start_time <= ${start}::timestamptz
          AND end_time   >= ${end}::timestamptz
        ORDER BY start_time ASC
      `
    } else {
      rows = await sql`
        SELECT id, title, type,
               to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_time,
               to_char(end_time   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_time,
               all_day, created_by,
               description, location, COALESCE(meta, '{}'::jsonb) AS meta
        FROM calendar_events
        ORDER BY start_time ASC
        LIMIT 500
      `
    }
    return NextResponse.json(rows, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST create
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, type, start_time, end_time, all_day = false, description, location, meta } = body
    const rows = await sql`
      INSERT INTO calendar_events (title, type, start_time, end_time, all_day, description, location, meta)
      VALUES (${title}, ${type}, ${start_time}::timestamptz, ${end_time}::timestamptz, ${all_day}, ${description}, ${location}, ${meta ?? {}})
      RETURNING id, title, type,
        to_char(start_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS start_time,
        to_char(end_time   AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
        all_day, created_by, description, location, COALESCE(meta, '{}'::jsonb) AS meta
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// PUT update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, type, start_time, end_time, all_day, description, location, meta } = body
    const rows = await sql`
      UPDATE calendar_events
      SET title      = COALESCE(${title}, title),
          type       = COALESCE(${type}, type),
          start_time = COALESCE(${start_time}::timestamptz, start_time),
          end_time   = COALESCE(${end_time}::timestamptz, end_time),
          all_day    = COALESCE(${all_day}, all_day),
          description= COALESCE(${description}, description),
          location   = COALESCE(${location}, location),
          meta       = COALESCE(${meta}, meta)
      WHERE id = ${id}
      RETURNING id, title, type,
        to_char(start_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS start_time,
        to_char(end_time   AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
        all_day, created_by, description, location, COALESCE(meta, '{}'::jsonb) AS meta
    `
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(rows[0], { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// DELETE /api/calendar/events?id=123
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await sql`DELETE FROM calendar_events WHERE id = ${id}`
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
