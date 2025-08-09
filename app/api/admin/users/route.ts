import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

const ALLOWED_ROLES = new Set(["Admin", "Manager", "Recruiter", "Viewer"])

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined

  if (!session?.user || role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json().catch(() => null)) as {
    email?: string
    name?: string
    role?: string
    password?: string
  } | null

  const email = body?.email?.trim().toLowerCase() || ""
  const name = body?.name?.trim() || ""
  const newRole = body?.role || "Viewer"
  const password = body?.password || ""

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Invalid payload. Email and password are required. Password must be at least 8 chars." },
      { status: 400 },
    )
  }
  if (!ALLOWED_ROLES.has(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const sql = getSql()
  try {
    const [row] = await sql /* sql */`
      INSERT INTO users (email, name, role, password_hash)
      VALUES (${email}, ${name}, ${newRole}, crypt(${password}, gen_salt('bf')))
      RETURNING id, email, name, role, created_at
    `
    return NextResponse.json({ data: row })
  } catch (err: any) {
    // Unique violation
    if (err?.message?.includes("duplicate key") || err?.code === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }
    console.error("Create user error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
