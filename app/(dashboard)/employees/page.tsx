"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import NewEmployeeDialog from "@/components/new-employee-dialog"

type Employee = {
  id: string
  name: string
  email: string
  role: string
  start_date: string
}

type Broadcast = { id: number; title: string; message: string; created_at: string }

export default function EmployeesPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "Admin"

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/employees")
      const data = await res.json()
      setEmployees(data?.data ?? [])
    } finally {
      setLoading(false)
    }
  }
  const fetchBroadcasts = async () => {
    const res = await fetch("/api/broadcasts")
    if (res.ok) setBroadcasts(await res.json())
  }

  useEffect(() => {
    fetchEmployees()
    fetchBroadcasts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendBroadcast = async () => {
    if (!title || !message) return
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, created_by: "hr-admin" }),
    })
    if (res.ok) {
      setTitle("")
      setMessage("")
      fetchBroadcasts()
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <p className="text-sm text-muted-foreground">{"Manage your team"}</p>
          </div>
          {isAdmin && <NewEmployeeDialog onCreated={fetchEmployees} />}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{e.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{e.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{e.role}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {e.start_date ? new Date(e.start_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => (window.location.href = "/calendar")}>
                          View Schedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      {loading ? "Loading..." : "No employees found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Send Broadcast</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Company Update" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message to all employees"
              />
            </div>
            <div>
              <Button onClick={sendBroadcast}>Send</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {broadcasts.length === 0 && <div className="text-sm text-muted-foreground">No broadcasts yet.</div>}
            {broadcasts.map((b) => (
              <div key={b.id} className="border rounded-md p-3">
                <div className="text-sm font-medium">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(b.created_at).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
