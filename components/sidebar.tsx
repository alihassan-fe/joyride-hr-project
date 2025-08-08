"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bot, FileText, LogOut, Users, LayoutDashboard  } from 'lucide-react'
import { signOut } from "next-auth/react"

type Props = {
  user?: { email?: string; role?: string }
}
export function Sidebar({ user = { email: "user@example.com", role: "Authenticated" } }: Props) {
  const pathname = usePathname()
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard  },
    { href: "/applicants", label: "Applicants", icon: FileText },
    { href: "/employees", label: "Employees", icon: Users },
  ]
  return (
    <aside className="border-r min-h-[100dvh] p-4 md:p-6 bg-neutral-50">
      <div className="mb-8">
        <Link href="/applicants" className="font-semibold">Joyride HR</Link>
        <div className="text-xs text-neutral-500 mt-1">{user.email}</div>
        <div className="text-xs text-neutral-600 mt-1">Role: {user.role}</div>
      </div>
      <nav className="grid gap-1">
        {items.map((it) => {
          const Icon = it.icon
          const active = pathname.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                active ? "bg-neutral-200 text-neutral-900" : "hover:bg-neutral-100 text-neutral-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <Button variant="outline" className="justify-start mt-4" onClick={() => {
          const ev = new CustomEvent("v0:ai:open")
          window.dispatchEvent(ev)
        }}>
          <Bot className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
        <Button
          variant="ghost"
          className="justify-start text-red-600 hover:text-red-700"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
