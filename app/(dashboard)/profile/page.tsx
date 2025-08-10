import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { signOut } from "next-auth/react"
import {LogOut} from "lucide-react"
import { SignOutButton } from "@/components/SignOutButton"

function initials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(" ").filter(Boolean)
  const first = parts[0]?.[0] || ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase()
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  const name = (user?.name as string) || user?.email?.split("@")[0] || "User"
  const email = (user?.email as string) || "unknown@example.com"
  const role = (user?.role as string) || "Authenticated"
  const image = (user?.image as string) || "/placeholder-user.jpg"

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account information and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">User</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={image || "/placeholder.svg"} alt={name} />
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-semibold leading-none">{name}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
              <div className="pt-1">
                <Badge variant="secondary">{role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ModeToggle />
            </div>
            <div className="text-xs text-muted-foreground">
              Theme preference is stored locally. We can sync it to your profile on request.
            </div>
          </CardContent>
        </Card>

        {/* Actions card */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
  <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
