import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { validatePasswordResetToken, markTokenAsUsed } from "@/lib/password-reset"

const sql = neon(process.env.DATABASE_URL as string)

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    
    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Validate the token
    const resetToken = await validatePasswordResetToken(token)
    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    // Update the user's password
    await sql`
      UPDATE users 
      SET password_hash = crypt(${password}, gen_salt('bf'))
      WHERE id = ${resetToken.user_id}::uuid
    `

    // Mark the token as used
    await markTokenAsUsed(resetToken.id)

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
