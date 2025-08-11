"use client"

import type * as React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { AppSidebar } from "@/components/app-sidebar"
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset 
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AIChatFloating } from "@/components/ai-chat-floating"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === "loading") return // Still loading
    
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router])
  
  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  // Don't render dashboard if not authenticated
  if (!session) {
    return null
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={session?.user as any} />
      <SidebarInset>
        <header
          className={cn(
            "sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur",
            "supports-[backdrop-filter]:bg-background/60",
          )}
          role="banner"
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2">
            {/* Right actions */}
            <ModeToggle />
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)] p-4">
          {children}
        </main>
      </SidebarInset>
      <AIChatFloating />
    </SidebarProvider>
  )
}