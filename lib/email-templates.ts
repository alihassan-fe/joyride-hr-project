export function renderNewUserWelcomeEmailHTML(params: {
  userName: string
  userEmail: string
  resetLink: string
  adminName?: string
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Joyride HR</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to Joyride HR</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Your Account is Ready</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">Hello ${escapeHtml(params.userName)}!</h2>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
            Your account has been created in the Joyride HR system. You can now access all the features and tools available to you.
          </p>
          ${params.adminName ? `
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
            Your account was created by <strong>${escapeHtml(params.adminName)}</strong>.
          </p>
          ` : ''}
        </div>

        <!-- Account Details -->
        <div style="margin-bottom: 24px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937;">Account Details</h3>
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">
            <strong>Email:</strong> ${escapeHtml(params.userEmail)}
          </p>
          <p style="margin: 0; font-size: 16px; color: #374151;">
            <strong>Status:</strong> <span style="color: #059669; font-weight: 500;">Active</span>
          </p>
        </div>

        <!-- Next Steps -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937;">Next Steps</h3>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
            To get started, you'll need to set up your password. Click the button below to create a secure password for your account.
          </p>
          <div style="text-align: center;">
            <a href="${escapeAttr(params.resetLink)}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              Set Your Password
            </a>
          </div>
        </div>

        <!-- Security Notice -->
        <div style="margin-bottom: 24px; background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #92400e;">Security Notice</h4>
          <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
            This password reset link will expire in 24 hours. For security reasons, please set your password as soon as possible.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Welcome to the Joyride HR team!
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            If you have any questions, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

export function renderPasswordResetEmailHTML(params: {
  userName: string
  resetLink: string
}) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Secure Your Account</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">Hello ${escapeHtml(params.userName)}!</h2>
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151; line-height: 1.6;">
            We received a request to reset your password for your Joyride HR account. Click the button below to create a new password.
          </p>
        </div>

        <!-- Action Button -->
        <div style="margin-bottom: 24px; text-align: center;">
          <a href="${escapeAttr(params.resetLink)}" style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <!-- Security Notice -->
        <div style="margin-bottom: 24px; background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #92400e;">Important Security Information</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e; line-height: 1.5;">
            <li>This link will expire in 24 hours</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your current password will remain unchanged until you complete this process</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Joyride HR System
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            If you have any questions, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;")
}
