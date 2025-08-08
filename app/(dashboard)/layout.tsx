import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decodeSession } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { AIChatFloating } from "@/components/ai-chat-floating"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("hr_session")?.value
  const session = token ? await decodeSession(token).catch(() => null) : null
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="grid md:grid-cols-[260px_1fr]">
        <Sidebar user={{ email: session!.email, role: session!.role }} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <AIChatFloating />
    </div>
  )
}
