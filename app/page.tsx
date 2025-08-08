import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-next"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect("/applicants")
  }
  redirect("/login")
}
