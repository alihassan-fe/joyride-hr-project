import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-next"
import { sql } from "@/lib/sql"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import AdminUsersTable, { type UserRow } from "@/components/admin-users-table"

async function loadUsers(): Promise<UserRow[]> {
  const rows = await sql<
    UserRow[]
  >`select id::text, email, name, role, created_at from users order by created_at desc nulls last limit 200`
  return rows
}

export default async function AdminUsersPage() {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || role !== "Admin") {
    redirect("/dashboard")
  }

  const users = await loadUsers()

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Users</h1>
        <p className="text-sm text-muted-foreground">Manage access. Only Admins can create, edit and delete users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Users table (now interactive) */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Latest 200 users. Edit roles, reset passwords, or delete.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUsersTable initialUsers={users} />
          </CardContent>
        </Card>

        {/* Right: Create user form */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Create user</CardTitle>
            <CardDescription>New users will log in with email/password. Assign a role.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}