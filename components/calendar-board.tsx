"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false }) as any
const dayGridPlugin = dynamic(() => import("@fullcalendar/daygrid"), { ssr: false }) as any
const timeGridPlugin = dynamic(() => import("@fullcalendar/timegrid"), { ssr: false }) as any
const interactionPlugin = dynamic(() => import("@fullcalendar/interaction"), { ssr: false }) as any

type Draft = {
  title: string
  type: "pto" | "holiday" | "interview"
  start: string
  end: string
  allDay: boolean
}

function typeBadge(t: Draft["type"]) {
  const map: Record<Draft["type"], string> = {
    pto: "bg-amber-100 text-amber-800",
    holiday: "bg-emerald-100 text-emerald-800",
    interview: "bg-indigo-100 text-indigo-800",
  }
  return map[t]
}

export function CalendarBoard() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)

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
          extendedProps: { type: e.type as Draft["type"] },
        })),
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const eventContent = useCallback((arg: any) => {
    const t: Draft["type"] = arg.event.extendedProps?.type
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
      type: "pto",
      start: arg.startStr,
      end: arg.endStr,
      allDay: arg.allDay,
    })
    setOpen(true)
  }, [])

  const handleEventDropOrResize = useCallback(async (info: any) => {
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
    } catch (e) {
      console.error(e)
      info.revert()
    }
  }, [])

  const handleCreate = useCallback(async () => {
    if (!draft) return
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title || draft.type.toUpperCase(),
        type: draft.type,
        start_time: draft.start,
        end_time: draft.end,
        all_day: draft.allDay,
      }),
    })
    if (res.ok) {
      setOpen(false)
      setDraft(null)
      fetchEvents()
    }
  }, [draft, fetchEvents])

  const handleEventClick = useCallback(
    async (info: any) => {
      const confirmDelete = window.confirm(`Delete "${info.event.title}"?`)
      if (!confirmDelete) return
      const res = await fetch(`/api/calendar/events?id=${info.event.id}`, { method: "DELETE" })
      if (res.ok) fetchEvents()
    },
    [fetchEvents],
  )

  const headerToolbar = useMemo(
    () => ({ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }),
    [],
  )

  return (
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
        <div className="w-full">
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
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft?.title || ""}
                onChange={(e) => setDraft((d) => d && { ...d, title: e.target.value })}
                placeholder="e.g., PTO - John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={draft?.type} onValueChange={(v: any) => setDraft((d) => d && { ...d, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pto">PTO</SelectItem>
                  <SelectItem value="holiday">Public Holiday</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {draft?.allDay ? "All-day event" : `From ${draft?.start} to ${draft?.end}`}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
