import { neon } from "@neondatabase/serverless"
import { renderNewUserWelcomeEmailHTML, renderPasswordResetEmailHTML } from "./email-templates"
import { createPasswordResetToken, getUserByEmail } from "./password-reset"

const sql = neon(process.env.DATABASE_URL as string)

export async function sendNewUserWelcomeEmail(params: {
  userEmail: string
  userName: string
  adminName?: string
  baseUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Create password reset token
    const user = await getUserByEmail(params.userEmail)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const token = await createPasswordResetToken(user.id)
    const baseUrl = params.baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    // Prepare email content
    const html = renderNewUserWelcomeEmailHTML({
      userName: params.userName,
      userEmail: params.userEmail,
      resetLink,
      adminName: params.adminName
    })

    // Send email using existing notification system
    const subject = "Welcome to Joyride HR - Set Up Your Account"
    const recipients = [params.userEmail]

    // Log to outbox for n8n processing
    await sql`
      INSERT INTO outbox (type, subject, recipients, html_content, status)
      VALUES ('email', ${subject}, ${recipients}, ${html}, 'pending')
    `

    // Trigger existing n8n webhook for email processing
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN
    if (webhookUrl) {
      try {
        const { triggerN8n } = await import("./n8n")
        const fullWebhookUrl = `${webhookUrl}/invite-user`
        console.log(`Triggering n8n webhook: ${fullWebhookUrl}`)
        await triggerN8n(fullWebhookUrl, {
          type: "new_user_welcome",
          email: params.userEmail,
          name: params.userName,
          resetLink,
          adminName: params.adminName,
          subject,
          html,
          workflow: "invite-user" // This should go to your /invite-user webhook
        })
        console.log(`Successfully triggered n8n webhook for new user: ${params.userEmail}`)
      } catch (webhookError) {
        console.error("Failed to trigger n8n webhook:", webhookError)
        // Don't fail the user creation if webhook fails
      }
    } else {
      console.warn("NEXT_PUBLIC_WEBHOOK_DOMAIN not configured - email will only be saved to outbox")
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to send new user welcome email:", error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetEmail(params: {
  userEmail: string
  userName: string
  baseUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Create password reset token
    const user = await getUserByEmail(params.userEmail)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    const token = await createPasswordResetToken(user.id)
    const baseUrl = params.baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?token=${token}`

    // Prepare email content
    const html = renderPasswordResetEmailHTML({
      userName: params.userName,
      resetLink
    })

    // Send email using existing notification system
    const subject = "Reset Your Joyride HR Password"
    const recipients = [params.userEmail]

    // Log to outbox for n8n processing
    await sql`
      INSERT INTO outbox (type, subject, recipients, html_content, status)
      VALUES ('email', ${subject}, ${recipients}, ${html}, 'pending')
    `

    // Trigger existing n8n webhook for email processing
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN
    if (webhookUrl) {
      try {
        const { triggerN8n } = await import("./n8n")
        const fullWebhookUrl = `${webhookUrl}/invite-user`
        console.log(`Triggering n8n webhook: ${fullWebhookUrl}`)
        await triggerN8n(fullWebhookUrl, {
          type: "password_reset",
          email: params.userEmail,
          name: params.userName,
          resetLink,
          subject,
          html,
          workflow: "invite-user" // This should go to your /invite-user webhook
        })
        console.log(`Successfully triggered n8n webhook for password reset: ${params.userEmail}`)
      } catch (webhookError) {
        console.error("Failed to trigger n8n webhook:", webhookError)
        // Don't fail the password reset if webhook fails
      }
    } else {
      console.warn("NEXT_PUBLIC_WEBHOOK_DOMAIN not configured - email will only be saved to outbox")
    }

    return { success: true }
  } catch (error: any) {
    console.error("Failed to send password reset email:", error)
    return { success: false, error: error.message }
  }
}
