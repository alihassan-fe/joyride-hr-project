"use client"

import { useState, useEffect, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type EventType = "pto" | "holiday" | "interview"

type CalendarEvent = {
  id?: number
  title: string
  type: EventType
  start: string
  end: string
  allDay?: boolean
  description?: string
  location?: string
  attendees?: string
  candidateEmail?: string
  panelEmails?: string
  videoLink?: string
}

type OutboxEntry = {
  id: number
  event_id: number
  subject: string
  recipients: string[]
  status: string
  created_at: string
  sent_at?: string
  error?: string
  payload: {
    html: string
    ics: string
    event: any
  }
}

const parseCsv = (str: string): string[] => {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function CalendarBoard() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<CalendarEvent | null>(null)
  const [outbox, setOutbox] = useState<OutboxEntry[]>([])
  const { toast } = useToast()
  const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://oriormedia.app.n8n.cloud/webhook/calender-invite"
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/events")
      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()

      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        allDay: event.all_day,
        backgroundColor: getEventColor(event.type),
        borderColor: getEventColor(event.type),
        extendedProps: {
          type: event.type,
          description: event.description,
          location: event.location,
          meta: event.meta || {},
        },
      }))

      setEvents(formattedEvents)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchOutbox = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/outbox")
      if (res.ok) {
        const data = await res.json()
        setOutbox(data)
      }
    } catch (error) {
      console.error("Failed to fetch outbox:", error)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    fetchOutbox()
  }, [fetchEvents, fetchOutbox])

  const getEventColor = (type: EventType) => {
    switch (type) {
      case "pto":
        return "#f59e0b"
      case "holiday":
        return "#ef4444"
      case "interview":
        return "#3b82f6"
      default:
        return "#6b7280"
    }
  }

  const handleSelect = (selectInfo: any) => {
    const newEvent: CalendarEvent = {
      title: "",
      type: "interview",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    }
    setDraft(newEvent)
    setDialogOpen(true)
  }

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const meta = event.extendedProps.meta || {}

    setDraft({
      id: Number.parseInt(event.id),
      title: event.title,
      type: event.extendedProps.type,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      description: event.extendedProps.description || "",
      location: event.extendedProps.location || "",
      attendees: Array.isArray(meta.attendees) ? meta.attendees.join(", ") : "",
      candidateEmail: meta.candidateEmail || "",
      panelEmails: Array.isArray(meta.panelEmails) ? meta.panelEmails.join(", ") : "",
      videoLink: meta.videoLink || "",
    })
    setDialogOpen(true)
  }

  const handleEventDrop = async (dropInfo: any) => {
    try {
      const event = dropInfo.event
      await fetch("/api/calendar/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number.parseInt(event.id),
          start_time: event.startStr,
          end_time: event.endStr,
        }),
      })

      toast({
        title: "Success",
        description: "Event updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      dropInfo.revert()
    }
  }

  const upsertEvent = async () => {
    if (!draft?.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      })
      return
    }

    try {
      const meta = {
        attendees: draft.attendees ? parseCsv(draft.attendees) : [],
        candidateEmail: draft.candidateEmail || undefined,
        panelEmails: draft.panelEmails ? parseCsv(draft.panelEmails) : [],
        videoLink: draft.videoLink || undefined,
      }

      const payload = {
        id: draft.id,
        title: draft.title,
        type: draft.type,
        start_time: draft.start,
        end_time: draft.end,
        all_day: draft.allDay || false,
        description: draft.description || null,
        location: draft.location || null,
        meta,
      }

      const method = draft.id ? "PUT" : "POST"
      const res = await fetch("/api/calendar/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save event")
      }

      const savedEvent = await res.json()

      // Update draft with the saved event ID
      setDraft((prev) => (prev ? { ...prev, id: savedEvent.id } : null))

      await fetchEvents()
      toast({
        title: "Success",
        description: draft.id ? "Event updated successfully" : "Event created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteEvent = async () => {
    if (!draft?.id) return

    try {
      const res = await fetch(`/api/calendar/events?id=${draft.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete event")

      await fetchEvents()
      setDialogOpen(false)
      setDraft(null)
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const sendInvites = async () => {
    console.log("Sending invites...")
    if (!draft?.id) {
      console.log("first")
      toast({
        title: "Error",
        description: "Please save the event first",
        variant: "destructive",
      })
      return console.log("first")
    }

    try {
      const recipients = [
        ...(draft.attendees ? parseCsv(draft.attendees) : []),
        ...(draft.candidateEmail ? [draft.candidateEmail] : []),
        ...(draft.panelEmails ? parseCsv(draft.panelEmails) : []),
      ].filter(Boolean)

      if (recipients.length === 0) {
          console.log("third")
        toast({
          title: "Error",
          description: "No recipients found. Add attendees, candidate email, or panel emails.",
          variant: "destructive",
        })
        return   console.log("third")
      }

      const res = await fetch("/api/calendar/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: draft.id,
          recipients,
          webhookUrl,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send invites")
      }

      await fetchOutbox()
      toast({
        title: "Success",
        description: "Invites sent successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
        console.log("error", error)
    }
  }

  const generateVideoLink = () => {
    if (!draft) return
    const meetingId = Math.random().toString(36).substring(2, 15)
    setDraft({ ...draft, videoLink: `https://meet.joyride-hr.com/${meetingId}` })
  }

  const downloadICS = (entry: OutboxEntry) => {
    const ics = entry.payload?.ics
    if (!ics) return

    const blob = new Blob([ics], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `event-${entry.event_id}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
            <CardHeader >
                    <CardTitle>Calender</CardTitle>
                    <p className="text-sm text-muted-foreground">{"Manage your Schedule"}</p>
                </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading calendar...</div>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventDrop}
              height="auto"
            />
          )}
        </CardContent>
      </Card>

      {/* Outbox */}
      {outbox.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outbox.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{entry.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      To: {entry.recipients.join(", ")} • {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.status === "sent" ? "default" : entry.status === "failed" ? "destructive" : "secondary"
                      }
                    >
                      {entry.status}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => downloadICS(entry)} disabled={!entry.payload?.ics}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={draft.type} onValueChange={(value: EventType) => setDraft({ ...draft, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="pto">PTO</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Event description"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={draft.location || ""}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="Meeting location or video link"
                />
              </div>

              <div>
                <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
                <Input
                  id="attendees"
                  value={draft.attendees || ""}
                  onChange={(e) => setDraft({ ...draft, attendees: e.target.value })}
                  placeholder="john@company.com, jane@company.com"
                />
              </div>

              {draft.type === "interview" && (
                <>
                  <div>
                    <Label htmlFor="candidateEmail">Candidate Email</Label>
                    <Input
                      id="candidateEmail"
                      value={draft.candidateEmail || ""}
                      onChange={(e) => setDraft({ ...draft, candidateEmail: e.target.value })}
                      placeholder="candidate@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="panelEmails">Panel Emails (comma-separated)</Label>
                    <Input
                      id="panelEmails"
                      value={draft.panelEmails || ""}
                      onChange={(e) => setDraft({ ...draft, panelEmails: e.target.value })}
                      placeholder="interviewer1@company.com, interviewer2@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="videoLink">Video Link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="videoLink"
                        value={draft.videoLink || ""}
                        onChange={(e) => setDraft({ ...draft, videoLink: e.target.value })}
                        placeholder="https://meet.google.com/abc-def-ghi"
                      />
                      <Button type="button" variant="outline" onClick={generateVideoLink}>
                        Generate
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {draft?.id && (
                <Button variant="destructive" onClick={deleteEvent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={upsertEvent}>{draft?.id ? "Update" : "Create"}</Button>
              <Button onClick={sendInvites} disabled={!draft?.id} variant="secondary">
                Trigger Invites
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { CalendarBoard }