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
import { Trash2, Download, Video, Calendar, Mail, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SearchableAutocomplete } from "@/components/searchable-autocomplete"

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
  googleMeetLink?: string
  googleCalendarId?: string
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

type SearchResult = {
  type: "candidate" | "employee"
  id: number | string
  name: string
  email: string
  phone?: string
  department?: string
  role?: string
}

const parseCsv = (str: string): string[] => {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function CalendarBoard() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<CalendarEvent | null>(null)
  const [outbox, setOutbox] = useState<OutboxEntry[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<SearchResult[]>([])
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false)
  const [syncingGoogleCalendar, setSyncingGoogleCalendar] = useState(false)
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
    setSelectedAttendees([])
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
      googleMeetLink: meta.googleMeetLink || "",
      googleCalendarId: meta.googleCalendarId || "",
    })
    
    // Convert existing attendees to SearchResult format
    const existingAttendees: SearchResult[] = []
    if (meta.attendees) {
      meta.attendees.forEach((email: string) => {
        existingAttendees.push({
          type: "employee",
          id: email,
          name: email.split('@')[0],
          email: email
        })
      })
    }
    setSelectedAttendees(existingAttendees)
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

  const generateGoogleMeetLink = async () => {
    if (!draft?.title || !draft?.start || !draft?.end) {
      toast({
        title: "Missing information",
        description: "Please fill in title, start time, and end time first",
        variant: "destructive",
      })
      return
    }

    setGeneratingMeetLink(true)
    try {
      const attendeeEmails = selectedAttendees.map(attendee => attendee.email)
      
      const response = await fetch("/api/calendar/google-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          start_time: draft.start,
          end_time: draft.end,
          attendees: attendeeEmails
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraft(prev => prev ? {
          ...prev,
          googleMeetLink: data.meetLink,
          location: data.meetLink
        } : null)
        
        toast({
          title: "Success",
          description: "Google Meet link generated successfully",
        })
      } else {
        throw new Error("Failed to generate Google Meet link")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate Google Meet link",
        variant: "destructive",
      })
    } finally {
      setGeneratingMeetLink(false)
    }
  }

  const syncWithGoogleCalendar = async () => {
    if (!draft?.id) {
      toast({
        title: "Error",
        description: "Please save the event first",
        variant: "destructive",
      })
      return
    }

    setSyncingGoogleCalendar(true)
    try {
      const response = await fetch("/api/calendar/google-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: draft.id,
          action: draft.googleCalendarId ? "update" : "create"
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraft(prev => prev ? {
          ...prev,
          googleCalendarId: data.googleCalendarEventId
        } : null)
        
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        throw new Error("Failed to sync with Google Calendar")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync with Google Calendar",
        variant: "destructive",
      })
    } finally {
      setSyncingGoogleCalendar(false)
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
      const attendeeEmails = selectedAttendees.map(attendee => attendee.email)
      
      const meta = {
        attendees: attendeeEmails,
        candidateEmail: draft.candidateEmail || undefined,
        panelEmails: draft.panelEmails ? parseCsv(draft.panelEmails) : [],
        videoLink: draft.videoLink || undefined,
        googleMeetLink: draft.googleMeetLink || undefined,
        googleCalendarId: draft.googleCalendarId || undefined,
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
      setSelectedAttendees([])
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
    if (!draft?.id) {
      toast({
        title: "Error",
        description: "Please save the event first",
        variant: "destructive",
      })
      return
    }

    try {
      const recipients = [
        ...selectedAttendees.map(attendee => attendee.email),
        ...(draft.candidateEmail ? [draft.candidateEmail] : []),
        ...(draft.panelEmails ? parseCsv(draft.panelEmails) : []),
      ].filter(Boolean)

      if (recipients.length === 0) {
        toast({
          title: "Error",
          description: "No recipients found. Add attendees, candidate email, or panel emails.",
          variant: "destructive",
        })
        return
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
    }
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

  const openGoogleMeet = () => {
    if (draft?.googleMeetLink) {
      window.open(draft.googleMeetLink, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <p className="text-sm text-muted-foreground">Manage your Schedule</p>
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
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="location">Location / Video Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={draft.location || ""}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="Meeting location or video link"
                  />
                  {draft.googleMeetLink && (
                    <Button variant="outline" onClick={openGoogleMeet}>
                      <Video className="h-4 w-4 mr-2" />
                      Open Meet
                    </Button>
                  )}
                </div>
              </div>

              {/* Attendees Search */}
              <div>
                <Label>Attendees</Label>
                <SearchableAutocomplete
                  placeholder="Search candidates and employees..."
                  onSelectionChange={setSelectedAttendees}
                  selectedItems={selectedAttendees}
                  maxItems={15}
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
                </>
              )}

              {/* Google Meet Integration */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateGoogleMeetLink}
                  disabled={generatingMeetLink || !draft.title || !draft.start || !draft.end}
                >
                  <Video className="h-4 w-4 mr-2" />
                  {generatingMeetLink ? "Generating..." : "Generate Google Meet"}
                </Button>
                {draft.googleMeetLink && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Meet Link Ready
                  </Badge>
                )}
              </div>

              {/* Google Calendar Sync */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={syncWithGoogleCalendar}
                  disabled={syncingGoogleCalendar || !draft.id}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {syncingGoogleCalendar ? "Syncing..." : "Sync to Google Calendar"}
                </Button>
                {draft.googleCalendarId && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Synced to Google Calendar
                  </Badge>
                )}
              </div>
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
                <Mail className="h-4 w-4 mr-2" />
                Send Invites
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { CalendarBoard }