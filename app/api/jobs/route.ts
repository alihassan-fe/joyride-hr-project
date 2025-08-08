import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  const rows = await sql/* sql */`
    SELECT id, title, description, requirements, created_at
    FROM jobs
    ORDER BY created_at DESC
  `
  return NextResponse.json({ data: rows })
}
