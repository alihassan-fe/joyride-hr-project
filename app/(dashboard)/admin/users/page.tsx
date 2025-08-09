import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-next"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateUserForm } from "@/components/create-user-form"

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string | null
}

async function loadUsers(): Promise<UserRow[]> {
  const sql = neon(process.env.DATABASE_URL as string)
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
        <p className="text-sm text-muted-foreground">Manage access. Only Admins can create users.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Users table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Latest 200 users. Name and role overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Name</TableHead>
                    <TableHead className="min-w-[260px]">Email</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name || u.email.split("@")[0]}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
