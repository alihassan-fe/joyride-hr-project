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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={session?.user} />
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
    </SidebarProvider>
  )
}
