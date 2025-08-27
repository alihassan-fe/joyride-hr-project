"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  RefreshCw, 
  Mail, 
  Trash2, 
  Search,
  X
} from "lucide-react"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: any
  employees: any[]
  candidates: any[]
  onEventCreate: (event: any) => void
  onEventUpdate: (event: any) => void
  onEventDelete: (eventId: string) => void
}

interface Attendee {
  id: string
  name: string
  email: string
  type: 'employee' | 'candidate'
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  employees,
  candidates,
  onEventCreate,
  onEventUpdate,
  onEventDelete
}: EventDialogProps) {
  const [draft, setDraft] = useState<any>({})
  const [selectedAttendees, setSelectedAttendees] = useState<Attendee[]>([])
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState("")
  const [attendeeSearchResults, setAttendeeSearchResults] = useState<Attendee[]>([])
  const [showAttendeeSearchResults, setShowAttendeeSearchResults] = useState(false)
  const [generatingMeetLink, setGeneratingMeetLink] = useState(false)
  const [syncingGoogleCalendar, setSyncingGoogleCalendar] = useState(false)
  const { toast } = useToast()

  // Initialize draft when event changes
  useEffect(() => {
    if (event) {
      setDraft(event)
      setSelectedAttendees(event.attendees || [])
    } else {
      setDraft({})
      setSelectedAttendees([])
    }
  }, [event])

  const handleAttendeeSearch = (query: string) => {
    setAttendeeSearchQuery(query)
    if (query.trim().length >= 2) {
      const allAttendees: Attendee[] = [
        ...employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          type: 'employee' as const
        })),
        ...candidates.map(cand => ({
          id: cand.id,
          name: cand.name,
          email: cand.email,
          type: 'candidate' as const
        }))
      ]
      
      const filtered = allAttendees.filter(attendee => 
        attendee.name.toLowerCase().includes(query.toLowerCase()) ||
        attendee.email.toLowerCase().includes(query.toLowerCase())
      )
      setAttendeeSearchResults(filtered.slice(0, 15))
      setShowAttendeeSearchResults(true)
    } else {
      setAttendeeSearchResults([])
      setShowAttendeeSearchResults(false)
    }
  }

  const handleAttendeeSelect = (attendee: Attendee) => {
    if (!selectedAttendees.find(a => a.id === attendee.id && a.type === attendee.type)) {
      setSelectedAttendees(prev => [...prev, attendee])
    }
    setAttendeeSearchQuery("")
    setShowAttendeeSearchResults(false)
  }

  const handleAttendeeRemove = (attendeeId: string, attendeeType: string) => {
    setSelectedAttendees(prev => prev.filter(a => !(a.id === attendeeId && a.type === attendeeType)))
  }

  const generateGoogleMeetLink = async () => {
    setGeneratingMeetLink(true)
    try {
      const response = await fetch("/api/calendar/google-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          start: draft.start,
          end: draft.end
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraft((prev: any) => ({ ...prev, googleMeetLink: data.meetLink }))
        toast({
          title: "Success",
          description: "Google Meet link generated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate Google Meet link",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Google Meet link",
        variant: "destructive",
      })
    } finally {
      setGeneratingMeetLink(false)
    }
  }

  const syncWithGoogleCalendar = async () => {
    setSyncingGoogleCalendar(true)
    try {
      const response = await fetch("/api/calendar/google-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: draft.id,
          title: draft.title,
          description: draft.description,
          start: draft.start,
          end: draft.end,
          location: draft.location,
          attendees: selectedAttendees.map(a => a.email)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDraft((prev: any) => ({ ...prev, googleCalendarId: data.calendarId }))
        toast({
          title: "Success",
          description: "Event synced to Google Calendar successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to sync with Google Calendar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync with Google Calendar",
        variant: "destructive",
      })
    } finally {
      setSyncingGoogleCalendar(false)
    }
  }

  const upsertEvent = async () => {
    if (!draft.title || !draft.start || !draft.end) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const eventData = {
      ...draft,
      type: draft.type || "interview", // Ensure type is always set
      start_time: draft.start,
      end_time: draft.end,
      attendees: selectedAttendees.map(a => ({ 
        attendee_type: a.type, 
        attendee_id: a.id, 
        attendee_name: a.name, 
        attendee_email: a.email 
      }))
    }

    if (draft.id) {
      onEventUpdate(eventData)
    } else {
      onEventCreate(eventData)
    }
    onOpenChange(false)
    resetForm()
  }

  const deleteEvent = async () => {
    if (draft.id) {
      onEventDelete(draft.id)
      onOpenChange(false)
      resetForm()
    }
  }

  const sendInvites = async () => {
    try {
      const response = await fetch("/api/calendar/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: draft.id,
          attendees: selectedAttendees.map(a => a.email)
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invites sent successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send invites",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invites",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setDraft({})
    setSelectedAttendees([])
    setAttendeeSearchQuery("")
    setAttendeeSearchResults([])
    setShowAttendeeSearchResults(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {draft?.id ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={draft.title || ""}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Event title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={draft.description || ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Start Date & Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={draft.start || ""}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end">End Date & Time *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={draft.end || ""}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={draft.location || ""}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Event location"
            />
          </div>

          <div>
            <Label htmlFor="type">Event Type</Label>
            <Select value={draft.type || "interview"} onValueChange={(value) => setDraft({ ...draft, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="pto">PTO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees Search */}
          <div>
            <Label>Attendees</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates and employees..."
                value={attendeeSearchQuery}
                onChange={(e) => handleAttendeeSearch(e.target.value)}
                className="pl-10"
                onFocus={() => {
                  if (attendeeSearchQuery.trim().length >= 2 && attendeeSearchResults.length > 0) {
                    setShowAttendeeSearchResults(true)
                  }
                }}
              />
              
              {/* Search Results Dropdown */}
              {showAttendeeSearchResults && attendeeSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {attendeeSearchResults.map((attendee) => (
                    <div
                      key={`${attendee.type}-${attendee.id}`}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleAttendeeSelect(attendee)}
                    >
                      <div className="font-medium">{attendee.name}</div>
                      <div className="text-sm text-muted-foreground">{attendee.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{attendee.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Attendees */}
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAttendees.map((attendee) => (
                  <Badge
                    key={`${attendee.type}-${attendee.id}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="truncate max-w-32">{attendee.name}</span>
                    <button
                      onClick={() => handleAttendeeRemove(attendee.id, attendee.type)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  )
}
