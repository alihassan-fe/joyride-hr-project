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

type Props = {
  onCreated?: () => void
  triggerClassName?: string
}

const ROLE_OPTIONS = ["Employee", "Manager", "Admin", "Viewer"] as const
const DEPARTMENTS = [
  "Operations",
  "Maintenance",
  "Safety",
  "Billing Payroll",
] as const

export function NewEmployeeDialog({ onCreated, triggerClassName }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("Employee")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [pto, setPto] = useState<number>(0)
  const [location, setLocation] = useState("")
  const [emergencyPhone, setEmergencyPhone] = useState("")
  const [department, setDepartment] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !role) {
      toast({ title: "Missing fields", description: "Name, Email and Role are required." })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          start_date: new Date(startDate).toISOString(),
          pto_balance: pto,
          location: location.trim() || null,
          phone: emergencyPhone.trim() || null,
            department: department.trim() || null,
        }),
      })
      if (!res.ok) {
        let msg = "Failed to create employee."
        try {
          const j = await res.json()
          if (j?.error) msg = j.error
        } catch {}
        toast({ title: "Error", description: msg })
        return
      }
      toast({ title: "Employee created", description: `${name} was added successfully.` })
      setOpen(false)
      setName("")
      setEmail("")
      setRole("Employee")
      setStartDate(new Date().toISOString().slice(0, 10))
      setPto(0)
      setLocation("")
      setEmergencyPhone("")
      onCreated?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>New Employee</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>{"Create a new employee record with complete profile information."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as (typeof ROLE_OPTIONS)[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="start">Start Date</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pto_balance">PTO Balance</Label>
            <Input
              id="pto_balance"
              type="number"
              value={pto}
              onChange={(e) => setPto(Number(e.target.value))}
              placeholder="0"
            />
          </div>
<div className="grid gap-2">
  <Label htmlFor="department">Department</Label>
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emergency_phone">Emergency Phone</Label>
            <Input
              id="emergency_phone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default NewEmployeeDialog
