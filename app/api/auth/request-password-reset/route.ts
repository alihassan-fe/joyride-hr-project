import { NextResponse } from "next/server"
import { sendPasswordResetEmail } from "@/lib/user-notifications"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    
    // Always return success to prevent email enumeration
    // The actual email sending happens in the background
    try {
      await sendPasswordResetEmail({
        userEmail: cleanEmail,
        userName: cleanEmail.split("@")[0] // Fallback name
      })
    } catch (error) {
      console.error("Password reset email error:", error)
      // Don't expose internal errors to client
    }

    return NextResponse.json({ 
      message: "If an account with that email exists, a password reset link has been sent." 
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
