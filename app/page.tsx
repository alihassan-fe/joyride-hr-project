import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decodeSession } from "@/lib/auth"

export default async function Home() {
  // Server Component: redirect based on auth
  const cookieStore = await cookies()
  const token = cookieStore.get("hr_session")?.value
  const session = token ? await decodeSession(token).catch(() => null) : null
  if (session) {
    redirect("/dashboard/applicants")
  }
  redirect("/login")
}
