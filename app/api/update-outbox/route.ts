import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL as string)

export async function POST(req: Request) {
  try {
    const { email, status, error_message } = await req.json()
    
    if (!email || !status) {
      return NextResponse.json({ error: "Email and status are required" }, { status: 400 })
    }

    // Update the outbox status
    await sql`
      UPDATE outbox 
      SET status = ${status}, 
          sent_at = CASE WHEN ${status} = 'sent' THEN now() ELSE sent_at END,
          error_message = ${error_message || null},
          updated_at = now()
      WHERE recipients @> ${[email]}::text[] 
      AND status = 'pending'
      ORDER BY created_at DESC 
      LIMIT 1
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update outbox:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
