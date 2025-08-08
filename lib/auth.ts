import { SignJWT, jwtVerify } from "jose"

const DEV_SECRET = new TextEncoder().encode("dev-secret-change-me")

type Session = {
  email: string
  role: "Admin" | "HR Manager" | "Recruiter" | "Viewer"
}

export async function createSession(payload: Session) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(DEV_SECRET)
  return token
}

export async function decodeSession(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, DEV_SECRET)
  return payload as any
}
