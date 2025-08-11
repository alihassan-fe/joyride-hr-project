"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export type EmployeeRow = {
  id: string
  name: string
  email: string
  role: string
  start_date: string
  pto_balance?: number
}

type Props = {
  employee: EmployeeRow
  onUpdated?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ROLES = ["Employee", "Manager", "Admin", "Viewer"] as const

export default function EditEmployeeDialog({ employee, onUpdated, trigger, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(employee.name)
  const [email, setEmail] = useState(employee.email)
  const [role, setRole] = useState<string>(employee.role || "Employee")
  const [startDate, setStartDate] = useState<string>(employee.start_date?.slice(0, 10) || "")
  const [pto, setPto] = useState<string>(String(employee.pto_balance ?? 0))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          pto_balance: Number.isFinite(Number(pto)) ? Number(pto) : 0,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to update employee")
      }
      toast({ title: "Employee updated", description: `${name} saved successfully.` })
      onOpenChange?.(false)
      onUpdated?.()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>Update profile details and role.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="emp_name">Name</Label>
            <Input id="emp_name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp_email">Email</Label>
            <Input id="emp_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp_start">Start date</Label>
            <Input id="emp_start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp_pto">PTO balance</Label>
            <Input id="emp_pto" type="number" value={pto} onChange={(e) => setPto(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
