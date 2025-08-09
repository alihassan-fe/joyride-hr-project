"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarBoard } from "@/components/calendar-board"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type PTO = {
  id: number
  employee_id: string
  employee_name: string
  start_date: string
  end_date: string
  reason?: string
  status: "pending" | "approved" | "rejected"
  manager_comment?: string
}

export default function CalendarPage() {
  const [requests, setRequests] = useState<PTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // create PTO request dialog
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ employee_id: "", employee_name: "", start_date: "", end_date: "", reason: "" })

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/pto/requests?status=pending")
      if (!res.ok) throw new Error("Failed to load PTO requests")
      setRequests(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const statusBadge = useMemo(
    () => ({
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
    }),
    [],
  )

  const updateStatus = async (req: PTO, status: "approved" | "rejected") => {
    const comment = status === "rejected" ? (prompt("Add a reason (optional):") ?? "") : ""
    const res = await fetch("/api/pto/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: req.id, status, manager_id: "manager-1", manager_comment: comment }),
    })
    if (res.ok) fetchRequests()
  }

  const createPTO = async () => {
    const res = await fetch("/api/pto/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setOpen(false)
      setForm({ employee_id: "", employee_name: "", start_date: "", end_date: "", reason: "" })
      fetchRequests()
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CalendarBoard />
        </div>
        <div className="grid gap-6">
          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>PTO Approvals</CardTitle>
              <div className="flex items-center gap-2">
                {loading && <Badge variant="secondary">Loading</Badge>}
                {error && <Badge variant="destructive">Error</Badge>}
                <Button size="sm" variant="outline" onClick={fetchRequests}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          No pending requests
                        </TableCell>
                      </TableRow>
                    )}
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{r.employee_name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.start_date} → {r.end_date}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={r.reason || ""}>
                          {r.reason}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge[r.status]}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r, "approved")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(r, "rejected")}>
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Request PTO</CardTitle>
              <Button size="sm" onClick={() => setOpen(true)}>
                New Request
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submit a PTO request which will appear for manager approval. Approved PTO is shown on the calendar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New PTO Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input
                value={form.employee_id}
                onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
                placeholder="e.g., emp_123"
              />
            </div>
            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input
                value={form.employee_name}
                onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))}
                placeholder="e.g., Jane Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPTO}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
