import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { decodeSession } from "@/lib/auth"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("hr_session")?.value
  if (!token) return NextResponse.json({ data: null })
  try {
    const data = await decodeSession(token)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ data: null })
  }
}
