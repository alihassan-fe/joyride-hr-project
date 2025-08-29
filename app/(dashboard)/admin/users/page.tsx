"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import AdminUsersTable, { type UserRow, type AdminUsersTableRef } from "@/components/admin-users-table"

// Client component wrapper for admin users page
export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const tableRef = useRef<AdminUsersTableRef>(null)

  // Check authentication and role
  useEffect(() => {
    if (status === "loading") return
    
    if (!session?.user || (session.user as any)?.role !== "Admin") {
      router.push("/dashboard")
      return
    }
    
    loadUsers()
  }, [session, status, router])

  async function loadUsers() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserCreated = (newUser: UserRow) => {
    // Add the new user to the table
    if (tableRef.current) {
      tableRef.current.addUser(newUser)
    }
  }

  const handleRefresh = () => {
    loadUsers()
  }

  // Show loading state while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Users</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

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
            <AdminUsersTable 
              ref={tableRef}
              initialUsers={users} 
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Right: Create user form */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Create user</CardTitle>
            <CardDescription>New users will log in with email/password. Assign a role.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm onUserCreated={handleUserCreated} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}