"use client"

import type * as React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur",
          "supports-[backdrop-filter]:bg-background/60",
        )}
        role="banner"
      >
        <div className="flex items-center gap-2">
          {/* Left area: space for breadcrumbs / sidebar trigger if you have one */}
        </div>
        <div className="flex items-center gap-2">
          {/* Right actions */}
          <ModeToggle />
        </div>
      </header>
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    </div>
  )
}
