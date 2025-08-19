import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  try {
    const sql = getSql()
    const teams = await sql`
      SELECT id, name, department, team_lead_id, location
      FROM teams 
      ORDER BY department, name
    `

    return NextResponse.json({ data: teams })
  } catch (error) {
    console.error("Failed to fetch teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
