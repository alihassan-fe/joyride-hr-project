import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"

export default async function AdminUsersPage() {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined

  // Only Admins can access
  if (!session?.user || role !== "Admin") {
    redirect("/dashboard")
  }

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Users</h1>
        <p className="text-sm text-muted-foreground">Create new user accounts and assign roles.</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>Only admins can create users. New users will log in with email/password.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
    </main>
  )
}
