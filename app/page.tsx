import { auth } from "@/lib/auth-next"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (session) {
    redirect("/dashboard")
  }
  redirect("/login")
}
