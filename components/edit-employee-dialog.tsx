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
import { Employee } from "@/lib/types"

type Props = {
  employee: Employee
  onUpdated?: () => void
  trigger?: React.ReactNode
    open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ROLES = ["Admin", "Manager", "HR"] as const
const DEPARTMENTS = [
  "Operations",
  "Maintenance",
  "Safety",
  "Billing Payroll",
] as const

export default function EditEmployeeDialog({
  employee,
  onUpdated,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const { toast } = useToast()
  // Use controlled state if provided, else fall back to internal state
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled && onOpenChange ? onOpenChange : setUncontrolledOpen
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(employee.name)
  const [email, setEmail] = useState(employee.email)
  const [role, setRole] = useState<string>(employee.role || "Employee")
  const [startDate, setStartDate] = useState<string>(employee.start_date?.slice(0, 10) || "")
  const [pto, setPto] = useState<string>(String(employee.pto_balance ?? 0))
  const [location, setLocation] = useState(employee.location || "")
  const [emergencyPhone, setEmergencyPhone] = useState(employee.phone || "")
  const [department, setDepartment] = useState(employee.department || "")

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
          location: location.trim() || null,
          phone: emergencyPhone.trim() || null,
            department: department.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to update employee")
      }
      toast({ title: "Employee updated", description: `${name} saved successfully.` })
      setOpen(false)
      onUpdated?.()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
  <Label htmlFor="emp_department">Department</Label>
  <Select value={department} onValueChange={setDepartment}>
    <SelectTrigger>
      <SelectValue placeholder="Select department" />
    </SelectTrigger>
    <SelectContent>
      {DEPARTMENTS.map((d) => (
        <SelectItem key={d} value={d}>
          {d}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
          <div className="grid gap-2">
            <Label htmlFor="emp_pto">PTO balance</Label>
            <Input id="emp_pto" type="number" value={pto} onChange={(e) => setPto(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp_location">Location</Label>
            <Input
              id="emp_location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emp_emergency_phone">Emergency Phone</Label>
            <Input
              id="emp_emergency_phone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
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
