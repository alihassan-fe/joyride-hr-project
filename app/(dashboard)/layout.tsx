import type React from "react"
import { auth } from "@/lib/auth-next"
import { redirect } from "next/navigation"
import { AppSidebar, SidebarInset, SidebarProvider, SidebarTrigger, Separator } from "@/components/app-sidebar"
import { AIChatFloating } from "@/components/ai-chat-floating"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={{ email: session.user.email || "", role: (session.user as any).role || "Authenticated" }} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <img src="/placeholder-logo.svg" alt="Company logo" className="h-6 w-auto" />
            <span className="text-sm text-neutral-500">Dashboard</span>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
      <AIChatFloating />
    </SidebarProvider>
  )
}
