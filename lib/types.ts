export type CandidateStatus = "Call Immediatley" | "Remove" | "Shortlist";

export type Candidate = {
id: number
  name: string
  email: string
  phone: string
  cvLink?: string
  dispatch?: number
  operationsManager?: number
  strengths?: string[]
  weaknesses?: string[]
  notes?: string
  recommendation?: CandidateStatus | null // 'Remove' | 'Consider' | undefined
}

export type Employee = {
  id: string
  name: string
  email: string
  role: string
  start_date: string
}

export type Event = {
  id: string
  type: string
  title: string
  start: string
  end: string
  owner_id?: string
}

export type EventType = "holiday" | "interview" | "meeting"
export type Draft = {
  id?: number
  title: string
  type: EventType
  start: string
  end: string
  allDay: boolean
  description?: string
  location?: string
  attendees?: string[] // general attendees
  candidateEmail?: string
  panelEmails?: string[]
  videoLink?: string
}

export type OutboxItem = {
  id: number
  event_id: number
  channel: string
  subject: string
  recipients: string[]
  status: string
  created_at: string
  event_title: string
  payload?: {
    html?: string
    ics?: string
  }
}
