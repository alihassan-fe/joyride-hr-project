import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const jobs = db.jobs.list()
  return NextResponse.json({ data: jobs })
}
