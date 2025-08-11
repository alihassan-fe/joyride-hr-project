"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Draft, EventType, OutboxItem } from "@/lib/types"

function typeBadge(t: EventType) {
  const map: Record<EventType, string> = {
    holiday: "bg-emerald-100 text-emerald-800",
    interview: "bg-purple-100 text-purple-800",
    meeting: "bg-slate-100 text-slate-800",
  }
  return map[t]
}

export function CalendarBoard() {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  console.log("🚀 ~ CalendarBoard ~ draft:", draft)

  const [outbox, setOutbox] = useState<OutboxItem[]>([])
  const [previewItem, setPreviewItem] = useState<OutboxItem | null>(null)

  // n8n controls
  const [useN8n, setUseN8n] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState("")

  useEffect(() => {
    // Restore UI prefs from localStorage
    try {
      const savedUseN8n = localStorage.getItem("calendar_use_n8n")
      const savedWebhook = localStorage.getItem("calendar_n8n_webhook")
      if (savedUseN8n != null) setUseN8n(savedUseN8n === "true")
      if (savedWebhook) setWebhookUrl(savedWebhook)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("calendar_use_n8n", String(useN8n))
      if (webhookUrl) localStorage.setItem("calendar_n8n_webhook", webhookUrl)
    } catch {}
  }, [useN8n, webhookUrl])

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    try {
      setLoading(true)
      const url = new URL("/api/calendar/events", window.location.origin)
      if (start && end) {
        url.searchParams.set("start", start)
        url.searchParams.set("end", end)
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const data = await res.json()
      setEvents(
        data.map((e: any) => ({
          id: e.id,
          title: e.title,
          start: e.start_time,
          end: e.end_time,
          allDay: e.all_day,
          extendedProps: {
            type: e.type as EventType,
            description: e.description || "",
            location: e.location || "",
            meta: e.meta || {},
          },
        })),
      )
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOutbox = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/outbox")
      if (res.ok) {
        const data = await res.json()
        setOutbox(data)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    fetchOutbox()
  }, [fetchEvents, fetchOutbox])

  const eventContent = useCallback((arg: any) => {
    const t: EventType = arg.event.extendedProps?.type
    return {
      html: `<div class="px-1 py-0.5 rounded ${typeBadge(t)}">
        <span class="text-[10px] uppercase">${t}</span>
        <span class="ml-1 text-xs">${arg.timeText ? arg.timeText : ""} ${arg.event.title}</span>
      </div>`,
    }
  }, [])

  const handleSelect = useCallback((arg: any) => {
    setDraft({
      title: "",
      type: "meeting",
      start: arg.startStr,
      end: arg.endStr,
      allDay: arg.allDay,
      description: "",
      location: "",
      attendees: [],
      candidateEmail: "",
      panelEmails: [],
      videoLink: "",
    })
    setOpen(true)
  }, [])

  const handleEventClick = useCallback((info: any) => {
    const meta = info.event.extendedProps?.meta || {}
    setDraft({
      id: Number(info.event.id),
      title: info.event.title,
      type: info.event.extendedProps.type,
      start: info.event.start?.toISOString() || "",
      end: info.event.end?.toISOString() || "",
      allDay: info.event.allDay,
      description: info.event.extendedProps?.description || "",
      location: info.event.extendedProps?.location || "",
      attendees: Array.isArray(meta.attendees) ? meta.attendees : [],
      candidateEmail: meta.candidateEmail || "",
      panelEmails: Array.isArray(meta.panelEmails) ? meta.panelEmails : [],
      videoLink: meta.videoLink || "",
    })
    setOpen(true)
  }, [])

  const handleEventDropOrResize = useCallback(
    async (info: any) => {
      try {
        const payload = {
          id: Number(info.event.id),
          start_time: info.event.start?.toISOString(),
          end_time: info.event.end?.toISOString(),
          all_day: info.event.allDay,
        }
        const res = await fetch("/api/calendar/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update")
        toast({ title: "Event updated" })
      } catch (e) {
        console.error(e)
        info.revert()
        toast({ title: "Update failed", variant: "destructive" })
      }
    },
    [toast],
  )

  const upsertEvent = useCallback(async () => {
    if (!draft) return
    const body = {
      id: draft.id,
      title: draft.title || draft.type.toUpperCase(),
      type: draft.type,
      start_time: draft.start,
      end_time: draft.end,
      all_day: draft.allDay,
      description: draft.description,
      location: draft.location,
      meta: {
        attendees: (draft.attendees || []).filter(Boolean),
        candidateEmail: draft.candidateEmail || undefined,
        panelEmails: (draft.panelEmails || []).filter(Boolean),
        videoLink: draft.videoLink || undefined,
      },
    }
    const method = draft.id ? "PUT" : "POST"
    const res = await fetch("/api/calendar/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: draft.id ? "Event saved" : "Event created" })
      setOpen(false)
      setDraft(null)
      fetchEvents()
    } else {
      toast({ title: "Failed to save", variant: "destructive" })
    }
  }, [draft, fetchEvents, toast])

  const handleDelete = useCallback(async () => {
    if (!draft?.id) return
    const confirmDelete = window.confirm(`Delete "${draft.title}"?`)
    if (!confirmDelete) return
    const res = await fetch(`/api/calendar/events?id=${draft.id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "Event deleted" })
      setOpen(false)
      setDraft(null)
      fetchEvents()
    } else {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }, [draft, fetchEvents, toast])

  const headerToolbar = useMemo(
    () => ({ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }),
    [],
  )

  const [attendeesCsv, setAttendeesCsv] = useState("")
  const [panelCsv, setPanelCsv] = useState("")

  useEffect(() => {
    if (draft) {
      setAttendeesCsv((draft.attendees || []).join(", "))
      setPanelCsv((draft.panelEmails || []).join(", "))
    } else {
      setAttendeesCsv("")
      setPanelCsv("")
    }
  }, [draft])

  const parseCsv = (s: string) =>
    s
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)

  const generateVideoLink = () => {
    const id = Math.random().toString(36).slice(2, 8)
    setDraft((d) => (d ? { ...d, videoLink: `https://meet.google.com/lookup/${id}` } : d))
  }

  const sendInvites = async () => {
    if (!draft?.id) {
      toast({ title: "Save the event first", variant: "destructive" })
      return
    }
    if (useN8n && !webhookUrl) {
      toast({ title: "Provide n8n Webhook URL", variant: "destructive" })
      return
    }
    const res = await fetch("/api/calendar/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: draft.id,
        recipients: [
          ...(parseCsv(attendeesCsv) || []),
          ...(draft.candidateEmail ? [draft.candidateEmail] : []),
          ...(parseCsv(panelCsv) || []),
        ],
        // n8n-first approach
        webhookUrl: useN8n ? webhookUrl : undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      toast({ title: data.notification?.status === "sent" ? "Workflow triggered" : "Queued" })
      fetchOutbox()
    } else {
      const err = await res.json().catch(() => ({}))
      toast({ title: err?.error || "Failed to trigger", variant: "destructive" })
    }
  }

  const downloadIcs = (item: OutboxItem) => {
    const ics = item.payload?.ics
    if (!ics) return
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `event-${item.event_id}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>HR Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchEvents()}>
              Refresh
            </Button>
            {loading && <Badge variant="secondary">Loading...</Badge>}
            {error && <Badge variant="destructive">Failed to load</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={headerToolbar}
            selectable
            editable
            droppable={false}
            eventResizableFromStart
            events={events}
            select={handleSelect}
            eventContent={eventContent}
            eventDrop={handleEventDropOrResize}
            eventResize={handleEventDropOrResize}
            eventClick={handleEventClick}
            height="auto"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outbox (Latest Activity)</CardTitle>
        </CardHeader>
        <CardContent>
          {outbox.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="space-y-2">
              {outbox.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 border rounded-md p-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{n.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {n.channel.toUpperCase()} • Event: {n.event_title} • {new Date(n.created_at).toLocaleString()} •{" "}
                      {n.recipients.length} recipient
                      {n.recipients.length !== 1 ? "s" : ""} • {n.status}
                      {n.message_id ? ` • id: ${n.message_id}` : ""}
                      {n.error ? ` • error: ${n.error}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {n.payload?.html && (
                      <Button size="sm" variant="outline" onClick={() => setPreviewItem(n)}>
                        Preview Email
                      </Button>
                    )}
                    {n.payload?.ics && (
                      <Button size="sm" variant="outline" onClick={() => downloadIcs(n)}>
                        Download ICS
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="!max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft?.title || ""}
                onChange={(e) => setDraft((d) => d && { ...d, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="space-y-2 w-full">
              <Label>Type</Label>
              <Select
                value={draft?.type}
                onValueChange={(v: EventType) => setDraft((d) => (d ? { ...d, type: v } : d))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="holiday">Public Holiday</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={draft?.description || ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                placeholder="Agenda, notes..."
              />
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={draft?.start ? draft.start.slice(0, 16) : ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, start: new Date(e.target.value).toISOString() } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={draft?.end ? draft.end.slice(0, 16) : ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, end: new Date(e.target.value).toISOString() } : d))}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={draft?.location || ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                placeholder="Office HQ, Zoom, Meet..."
              />
            </div>
            <div className="space-y-2">
              <Label>Attendees (comma separated emails)</Label>
              <Input
                value={attendeesCsv}
                onChange={(e) => {
                  setAttendeesCsv(e.target.value)
                  setDraft((d) => (d ? { ...d, attendees: parseCsv(e.target.value) } : d))
                }}
                placeholder="jane@co.com, john@co.com"
              />
            </div>

            {draft?.type === "interview" && (
              <>
                <div className="space-y-2">
                  <Label>Candidate email</Label>
                  <Input
                    value={draft?.candidateEmail || ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, candidateEmail: e.target.value } : d))}
                    placeholder="candidate@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interview Panel (comma separated emails)</Label>
                  <Input
                    value={panelCsv}
                    onChange={(e) => {
                      setPanelCsv(e.target.value)
                      setDraft((d) => (d ? { ...d, panelEmails: parseCsv(e.target.value) } : d))
                    }}
                    placeholder="lead@co.com, hr@co.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Video Conference Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={draft?.videoLink || ""}
                      onChange={(e) => setDraft((d) => (d ? { ...d, videoLink: e.target.value } : d))}
                      placeholder="https://meet.google.com/..."
                    />
                    <Button type="button" variant="outline" onClick={generateVideoLink}>
                      Generate
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="md:col-span-2 border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="use-n8n"
                  type="checkbox"
                  checked={useN8n}
                  onChange={(e) => setUseN8n(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="use-n8n">Use n8n workflow for invites</Label>
              </div>
              {useN8n && (
                <div className="space-y-1">
                  <Label>n8n Webhook URL</Label>
                  <Input
                    placeholder="https://n8n.yourdomain.com/webhook/XXXXXXXX"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your workflow can send emails, Slack messages, and handle retries. We sign requests with HMAC if you
                    set N8N_WEBHOOK_SECRET on the server.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {draft?.id && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={upsertEvent}>{draft?.id ? "Save" : "Create"}</Button>
            <Button variant="secondary" onClick={sendInvites} disabled={!draft?.id}>
              Trigger invites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.subject || "Email Preview"}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md h-[60vh] overflow-auto bg-white">
            {previewItem?.payload?.html ? (
              <div
                className="p-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewItem.payload.html }}
              />
            ) : (
              <div className="p-4 text-sm text-muted-foreground">No HTML available.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewItem(null)}>
              Close
            </Button>
            {previewItem?.payload?.ics && <Button onClick={() => downloadIcs(previewItem!)}>Download ICS</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
