import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth-next"

const sql = neon(process.env.DATABASE_URL as string)

function isAdmin(session: any) {
  return session?.user && (session.user as any)?.role === "Admin"
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    // Adjust column names if your schema differs
    const rows = await sql<
      { id: string; email: string; name: string | null; role: string; created_at: string | null }[]
    >`select id::text, email, name, role, created_at from users order by created_at desc nulls last limit 200`
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load users" }, { status: 500 })
  }
}

type PostBody = { email?: string; name?: string; role?: string; password?: string }

const ALLOWED_ROLES = new Set(["Admin", "Manager", "HR"])

export async function POST(req: Request) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json()) as PostBody
  const email = (body.email || "").trim().toLowerCase()
  const name = (body.name || "").trim()
  const role = (body.role || "").trim()
  const password = (body.password || "").trim()

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing email, password, or role" }, { status: 400 })
  }
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }
  // Naive email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  try {
    const rows = await sql<
      { id: string; email: string; name: string | null; role: string; created_at: string | null }[]
    >`insert into users (email, name, role, password_hash)
      values (${email}, ${name || null}, ${role}, crypt(${password}, gen_salt('bf')))
      on conflict (email) do nothing
      returning id::text, email, name, role, created_at`
    if (rows.length === 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }
    return NextResponse.json({ data: rows[0] }, { status: 201 })
  } catch (e: any) {
    // 23505 unique_violation
    if (e?.code === "23505") {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: e?.message || "Failed to create user" }, { status: 500 })
  }
}
