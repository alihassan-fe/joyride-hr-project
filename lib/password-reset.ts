import { neon } from "@neondatabase/serverless"
import { randomBytes, createHash } from "crypto"

const sql = neon(process.env.DATABASE_URL as string)

export interface PasswordResetToken {
  id: string
  user_id: string
  token: string
  expires_at: Date
  used: boolean
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}::uuid, ${token}, ${expiresAt})
  `

  return token
}

export async function validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const rows = await sql<PasswordResetToken[]>`
    SELECT id, user_id, token, expires_at, used
    FROM password_reset_tokens
    WHERE token = ${token}
    AND expires_at > NOW()
    AND used = false
    LIMIT 1
  `

  return rows.length > 0 ? rows[0] : null
}

export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await sql`
    UPDATE password_reset_tokens
    SET used = true
    WHERE id = ${tokenId}::uuid
  `
}

export async function getUserByEmail(email: string): Promise<{ id: string; email: string; name: string | null } | null> {
  const rows = await sql<{ id: string; email: string; name: string | null }[]>`
    SELECT id::text, email, name
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  return rows.length > 0 ? rows[0] : null
}
