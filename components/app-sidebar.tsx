import React from "react"
import { Home, Users, Calendar, UserCheck, MapIcon as Sitemap } from "lucide-react"
import { Sidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const AppSidebar = () => {
  const items = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Org Chart", href: "/org-chart", icon: Sitemap },
    { title: "Calendar", href: "/calendar", icon: Calendar },
    { title: "Employees", href: "/employees", icon: Users },
    { title: "Applicants", href: "/applicants", icon: UserCheck },
    // Broadcasts entry removed
    // { title: "Broadcasts", href: "/broadcasts", icon: Megaphone },
    // Other items remain as-is
  ]

  return (
    <Sidebar>
      {items.map((item) => (
        <Sidebar.Item key={item.href} href={item.href}>
          <div className="flex items-center">
            {React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
            <span>{item.title}</span>
          </div>
        </Sidebar.Item>
      ))}
      <Separator />
      {/* Other sidebar items here */}
    </Sidebar>
  )
}

export default AppSidebar
export { AppSidebar }
