"use client"

import type React from "react"

import { useMemo, useState, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Pencil, Key } from "lucide-react"

export type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string | null
}

const ROLES = ["Admin", "Manager", "HR"] as const

type Props = {
  initialUsers: UserRow[]
  onRefresh?: () => void
  isLoading?: boolean
}

export interface AdminUsersTableRef {
  addUser: (user: UserRow) => void
}

const AdminUsersTable = forwardRef<AdminUsersTableRef, Props>(({ initialUsers, onRefresh, isLoading }, ref) => {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRow[]>(initialUsers || [])
  const [confirm, setConfirm] = useState<{ id: string; email: string } | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [resetPassword, setResetPassword] = useState<{ id: string; email: string; name: string } | null>(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)

const sorted = useMemo(() => {
  return [...users].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime; // descending order
  });
}, [users]);

// Function to add a new user to the table
const addUser = (newUser: UserRow) => {
  setUsers(prev => [newUser, ...prev])
}

// Expose addUser function to parent component
useImperativeHandle(ref, () => ({
  addUser
}))


  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to delete user")
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast({ title: "User deleted" })
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh()
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Delete failed" })
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const name = (fd.get("name") as string)?.trim() || null
    const role = (fd.get("role") as string)?.trim() || null
    const password = (fd.get("password") as string)?.trim() || null

    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update user")
      }
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...data } : u)))
      toast({ title: "User updated", description: `${data.email} (${data.role})` })
      setEditing(null)
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh()
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed" })
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!resetPassword) return
    
    setResettingPassword(true)
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetPassword.email }),
      })

      if (res.ok) {
        toast({ 
          title: "Password reset email sent", 
          description: `Reset link sent to ${resetPassword.email}` 
        })
      } else {
        const data = await res.json()
        throw new Error(data?.error || "Failed to send reset email")
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Reset failed" })
    } finally {
      setResettingPassword(false)
      setResetPassword(null)
    }
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Name</TableHead>
            <TableHead className="min-w-[260px]">Email</TableHead>
            <TableHead className="min-w-[120px]">Role</TableHead>
            <TableHead className="text-right min-w-[160px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name || u.email.split("@")[0]}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{u.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(u)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setResetPassword({ id: u.id, email: u.email, name: u.name || u.email.split("@")[0] })}
                  >
                    <Key className="mr-1 h-4 w-4" />
                    Reset
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirm({ id: u.id, email: u.email })}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          )}
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                Loading users...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirm */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && !deleting && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              {confirm ? `Are you sure you want to delete ${confirm.email}? This cannot be undone.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirm(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirm && handleDelete(confirm.id)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update name, role, or set a new password.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleSaveEdit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing.name || ""} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  defaultValue={editing.email} 
                  disabled={true}
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed for existing users
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  defaultValue={editing.role}
                  name="role"
                  onValueChange={(v) => {
                    const input = document.querySelector<HTMLInputElement>('input[name="role-shadow"]')
                    if (input) input.value = v
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* hidden input to carry role in FormData */}
                <input type="hidden" name="role" defaultValue={editing.role} />
                <input type="hidden" name="role-shadow" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">New password (optional)</Label>
                <Input id="password" name="password" type="password" placeholder="Leave blank to keep current" />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset password confirm */}
      <Dialog open={!!resetPassword} onOpenChange={(o) => !o && !resettingPassword && setResetPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send password reset email</DialogTitle>
            <DialogDescription>
              {resetPassword ? `Send a password reset link to ${resetPassword.email}?` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setResetPassword(null)}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

export default AdminUsersTable
