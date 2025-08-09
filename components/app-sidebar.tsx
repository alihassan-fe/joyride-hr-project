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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Calendar, FileText, LayoutDashboard, LogOut, Megaphone, UserPlus, Users } from "lucide-react"
import { signOut } from "next-auth/react"

type Props = {
  user?: { email?: string; role?: string }
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applicants", label: "Applicants", icon: FileText },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
]

const adminNavItems = [
  { href: "/admin/users", label: "Admin Users", icon: UserPlus },
]

export function AppSidebar({ user = { email: "user@example.com", role: "Authenticated" } }: Props) {
  const pathname = usePathname()
  const isAdmin = user?.role === "Admin"
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/rsz_jr_color_long.png" alt="Company logo" className="h-6 w-auto" />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
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
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
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
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
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
        <div className="px-2 group-data-[collapsible=icon]:hidden">
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
