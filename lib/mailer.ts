import { Resend } from "resend"
import nodemailer from "nodemailer"

type SendParams = {
  to: string[]
  subject: string
  html: string
  ics: string
}

type SendResult =
  | { provider: "resend"; id: string }
  | { provider: "smtp"; id: string }
  | { provider: "noop"; id: string }

function getFromAddress() {
  return process.env.MAIL_FROM || "Joyride HR <no-reply@example.com>"
}

function canUseResend() {
  return !!process.env.RESEND_API_KEY
}

function canUseSMTP() {
  return !!process.env.SMTP_HOST
}

export async function sendEventEmail(params: SendParams): Promise<SendResult> {
  const from = getFromAddress()

  if (canUseResend()) {
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const sent = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: [
        {
          filename: "invite.ics",
          content: params.ics,
          contentType: "text/calendar; charset=utf-8; method=REQUEST",
        },
      ],
    })
    // Resend returns { id?: string; ... }, errors throw
    return { provider: "resend", id: sent.id ?? "" }
  }

  if (canUseSMTP()) {
    const port = Number.parseInt(process.env.SMTP_PORT || "587", 10)
    const secure = process.env.SMTP_SECURE === "true" || port === 465
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })

    const info = await transporter.sendMail({
      from,
      to: params.to.join(", "),
      subject: params.subject,
      html: params.html,
      attachments: [
        {
          filename: "invite.ics",
          content: params.ics,
          contentType: "text/calendar; charset=utf-8; method=REQUEST",
        },
      ],
    })

    return { provider: "smtp", id: info.messageId }
  }

  // No provider configured; keep Outbox record as 'queued'
  return { provider: "noop", id: "not-sent-no-provider" }
}
