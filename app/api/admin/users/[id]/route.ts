import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth-next"

const sql = neon(process.env.DATABASE_URL as string)

function isAdmin(session: any) {
  return session?.user && (session.user as any)?.role === "Admin"
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string | null
    role?: string | null
    password?: string | null
  }

  const name = body.name ? body.name.trim() : null
  const role = body.role ? body.role.trim() : null
  const password = body.password ? body.password.trim() : null

  // Optional: basic role allow-list; expand to align with UI
  const ALLOWED_ROLES = new Set(["Admin", "Manager", "HR", "Employee", "Recruiter", "Viewer", "Authenticated"])
  if (role && !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  try {
    const rows = await sql<
      { id: string; email: string; name: string | null; role: string; created_at: string | null }[]
    >`
      UPDATE users SET
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role),
        password_hash = CASE
          WHEN ${password} IS NULL OR ${password} = '' THEN password_hash
          ELSE crypt(${password}, gen_salt('bf'))
        END
      WHERE id = ${context.params.id}::uuid
      RETURNING id::text, email, name, role, created_at
    `
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: { params: { id: string } }) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const rows = await sql<{ id: string }[]>`
      DELETE FROM users WHERE id = ${context.params.id}::uuid RETURNING id::text
    `
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete user" }, { status: 500 })
  }
}
