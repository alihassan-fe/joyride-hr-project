import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-next"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AIChatFloating } from "@/components/ai-chat-floating"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }
  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="grid md:grid-cols-[260px_1fr]">
        <Sidebar user={{ email: session.user.email || "", role: (session.user as any).role || "Authenticated" }} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
      <AIChatFloating />
    </div>
  )
}
