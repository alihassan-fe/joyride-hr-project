"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bot, Calendar, FileText, LayoutDashboard, LogOut, Megaphone, Users } from "lucide-react"
import { signOut } from "next-auth/react"

type Props = {
  user?: { email?: string; role?: string }
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/applicants", label: "Applicants", icon: FileText },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/broadcasts", label: "Broadcasts", icon: Megaphone },
]

export function AppSidebar({ user = { email: "user@example.com", role: "Authenticated" } }: Props) {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="icon" className="">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/placeholder-logo.svg" alt="Company logo" className="h-6 w-auto" />
            <span className="text-sm font-semibold">Joyride HR</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-1">
          <div className="text-xs text-muted-foreground leading-tight">
            <div className="truncate">{user.email}</div>
            <div className="flex items-center gap-1">
              <span>Role:</span>
              <Badge variant="secondary" className="text-[10px]">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
        <div className="px-2">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => {
              const ev = new CustomEvent("v0:ai:open")
              window.dispatchEvent(ev)
            }}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
        <div className="px-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Re-export helpers so layout can import from here
export { SidebarInset, SidebarProvider, SidebarTrigger, Separator }
