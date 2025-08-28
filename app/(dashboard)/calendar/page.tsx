"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarBoard } from "@/components/calendar-board"
import { CalendarView } from "@/components/calendar-view"
import { EventDialog } from "@/components/event-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { InterviewSchedulingDialog } from "@/components/interview-scheduling-dialog"
import { PTORequestDialog } from "@/components/pto-request-dialog"

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [ptoRequests, setPtoRequests] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [showPTODialog, setShowPTODialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedView, setSelectedView] = useState("calendar")

  const { toast } = useToast()

  const statusBadge = useMemo(
    () => ({
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }),
    [],
  )

  const statusIcon = useMemo(
    () => ({
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
    }),
    [],
  )

  useEffect(() => {
    fetchEvents()
    fetchPTORequests()
    fetchEmployees()
    fetchCandidates()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/calendar/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch events:", response.status)
        setEvents([])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCandidates = async () => {
    try {
      const response = await fetch("/api/candidates")
      if (response.ok) {
        const data = await response.json()
        setCandidates(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch candidates:", response.status)
        setCandidates([])
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error)
      setCandidates([])
    }
  }

  const handleEventCreate = async (event: any) => {
    try {
      // Ensure the event has the correct field names for the API
      const apiEvent = {
        ...event,
        start_time: event.start_time || event.start,
        end_time: event.end_time || event.end,
        attendees: event.attendees?.map((a: any) => ({
          attendee_type: a.attendee_type || a.type,
          attendee_id: a.attendee_id || a.id,
          attendee_name: a.attendee_name || a.name,
          attendee_email: a.attendee_email || a.email
        })) || []
      }

      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiEvent),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event created successfully",
        })
        fetchEvents()
        setShowEventDialog(false)
        setSelectedEvent(null)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const handleEventUpdate = async (event: any) => {
    try {
      // Ensure the event has the correct field names for the API
      const apiEvent = {
        ...event,
        start_time: event.start_time || event.start,
        end_time: event.end_time || event.end,
        attendees: event.attendees?.map((a: any) => ({
          attendee_type: a.attendee_type || a.type,
          attendee_id: a.attendee_id || a.id,
          attendee_name: a.attendee_name || a.name,
          attendee_email: a.attendee_email || a.email
        })) || []
      }

      const response = await fetch(`/api/calendar/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiEvent),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event updated successfully",
        })
        fetchEvents()
        setShowEventDialog(false)
        setSelectedEvent(null)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      })
    }
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        })
        fetchEvents()
        setShowEventDialog(false)
        setSelectedEvent(null)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  const fetchPTORequests = async () => {
    try {
      const response = await fetch("/api/calendar/pto")
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array
        setPtoRequests(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch PTO requests:", response.status)
        setPtoRequests([])
      }
    } catch (error) {
      console.error("Failed to fetch PTO requests:", error)
      setPtoRequests([])
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees")
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  const handlePTOAction = async (ptoId: number, action: string, comment?: string) => {
    try {
      console.log(`Attempting to ${action} PTO request ${ptoId}`)
      const response = await fetch("/api/calendar/pto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ptoId,
          status: action,
          manager_comment: comment
        }),
      })

      console.log(`PTO action response status: ${response.status}`)

      if (response.ok) {
        toast({
          title: "Success",
          description: `PTO request ${action} successfully`,
        })
        fetchPTORequests()
      } else {
        const error = await response.json()
        console.log(`PTO action error:`, error)
        toast({
          title: "Error",
          description: error.error || "Failed to update PTO request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("PTO action catch error:", error)
      toast({
        title: "Error",
        description: "Failed to update PTO request",
        variant: "destructive",
      })
    }
  }

  const handleCancelPTO = async (ptoId: number) => {
    try {
      console.log(`Attempting to cancel PTO request ${ptoId}`)
      const response = await fetch(`/api/calendar/pto?id=${ptoId}`, {
        method: "DELETE",
      })

      console.log(`PTO cancel response status: ${response.status}`)

      if (response.ok) {
        toast({
          title: "Success",
          description: "PTO request cancelled successfully",
        })
        fetchPTORequests()
      } else {
        const error = await response.json()
        console.log(`PTO cancel error:`, error)
        toast({
          title: "Error",
          description: error.error || "Failed to cancel PTO request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("PTO cancel catch error:", error)
      toast({
        title: "Error",
        description: "Failed to cancel PTO request",
        variant: "destructive",
      })
    }
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }

  const handleDateClick = (date: Date) => {
    const newEvent = {
      start: date.toISOString().slice(0, 16),
      end: new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
    }
    setSelectedEvent(newEvent)
    setShowEventDialog(true)
  }

  const groupPTORequests = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    return {
      past: ptoRequests.filter(pto => pto.end_date < today),
      current: ptoRequests.filter(pto => 
        pto.start_date <= today && pto.end_date >= today && pto.status === 'approved'
      ),
      planned: ptoRequests.filter(pto => 
        pto.start_date > today && pto.status === 'approved'
      ),
      pending: ptoRequests.filter(pto => pto.status === 'pending'),
      rejected: ptoRequests.filter(pto => pto.status === 'rejected'),
    }
  }

  const groupedPTO = groupPTORequests()

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR Calendar</h1>
          <p className="text-muted-foreground">
            Manage interviews, PTO requests, and team scheduling
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button onClick={() => setShowInterviewDialog(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button> */}
          <Button onClick={() => setShowPTODialog(true)} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Add PTO
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="pto">PTO Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView
            events={events}
            onEventCreate={handleEventCreate}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        </TabsContent>

        <TabsContent value="pto" className="space-y-6">
          {/* PTO Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current PTO</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedPTO.current.length}</div>
                <p className="text-xs text-muted-foreground">
                  People out today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedPTO.pending.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planned PTO</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedPTO.planned.length}</div>
                <p className="text-xs text-muted-foreground">
                  Future approved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Past PTO</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedPTO.past.length}</div>
                <p className="text-xs text-muted-foreground">
                  Historical records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedPTO.rejected.length}</div>
                <p className="text-xs text-muted-foreground">
                  Denied requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PTO Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current PTO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current PTO
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedPTO.current.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No one is currently on PTO</p>
                ) : (
                  <div className="space-y-2">
                    {groupedPTO.current.map((pto) => (
                      <div key={pto.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{pto.employee_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pto.start_date} - {pto.end_date} ({pto.days_requested} days)
                          </p>
                        </div>
                        <Badge className={statusBadge[pto.status as keyof typeof statusBadge]}>
                          {statusIcon[pto.status as keyof typeof statusIcon]}
                          {pto.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedPTO.pending.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending PTO requests</p>
                ) : (
                  <div className="space-y-2">
                    {groupedPTO.pending.map((pto) => (
                      <div key={pto.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{pto.employee_name}</p>
                          <Badge className={statusBadge[pto.status as keyof typeof statusBadge]}>
                            {statusIcon[pto.status as keyof typeof statusIcon]}
                            {pto.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {pto.start_date} - {pto.end_date} ({pto.days_requested} days)
                        </p>
                        {pto.reason && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Reason: {pto.reason}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePTOAction(pto.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePTOAction(pto.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All PTO Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>All PTO Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ptoRequests.map((pto) => (
                    <TableRow key={pto.id}>
                      <TableCell className="font-medium">{pto.employee_name}</TableCell>
                      <TableCell>{pto.department}</TableCell>
                      <TableCell>
  {new Date(pto.start_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}{" "}
  -{" "}
  {new Date(pto.end_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}
</TableCell>

                      <TableCell>{pto.days_requested}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge[pto.status as keyof typeof statusBadge]}>
                          {statusIcon[pto.status as keyof typeof statusIcon]}
                          {pto.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{pto.manager_name}</TableCell>
                      <TableCell>
                        {pto.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handlePTOAction(pto.id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePTOAction(pto.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {(pto.status === "pending" || pto.status === "approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelPTO(pto.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InterviewSchedulingDialog
        open={showInterviewDialog}
        onOpenChange={setShowInterviewDialog}
        candidates={candidates}
        employees={employees}
        onSuccess={() => {
          setShowInterviewDialog(false)
          fetchEvents()
        }}
      />

      <PTORequestDialog
        open={showPTODialog}
        onOpenChange={setShowPTODialog}
        employees={employees}
        onSuccess={() => {
          setShowPTODialog(false)
          fetchPTORequests()
        }}
      />

      <EventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={selectedEvent}
        employees={employees}
        candidates={candidates}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />

      <Toaster />
    </div>
  )
}
