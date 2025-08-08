import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.role) {
    return NextResponse.json({ error: "email and role required" }, { status: 400 })
  }
  const allowed = ["Admin","HR Manager","Recruiter","Viewer"]
  if (!allowed.includes(body.role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 })
  }
  const token = await createSession({ email: body.email, role: body.role })
  const cookieStore = await cookies()
  cookieStore.set("hr_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  })
  return NextResponse.json({ ok: true })
}
