"use client"

import type React from "react"

import { useMemo, useState } from "react"
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
import { Trash2, Pencil } from "lucide-react"

export type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string | null
}

const ROLES = ["Admin", "Manager", "HR", "Employee", "Recruiter", "Viewer", "Authenticated"] as const

type Props = {
  initialUsers: UserRow[]
}

export default function AdminUsersTable({ initialUsers }: Props) {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRow[]>(initialUsers || [])
  const [confirm, setConfirm] = useState<{ id: string; email: string } | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)

  const sorted = useMemo(
    () => [...users].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")),
    [users],
  )

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to delete user")
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast({ title: "User deleted" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Delete failed" })
    } finally {
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
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed" })
    } finally {
      setSaving(false)
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
                  <Button variant="destructive" size="sm" onClick={() => setConfirm({ id: u.id, email: u.email })}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete confirm */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              {confirm ? `Are you sure you want to delete ${confirm.email}? This cannot be undone.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => confirm && handleDelete(confirm.id)}>
              Delete
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
    </div>
  )
}
