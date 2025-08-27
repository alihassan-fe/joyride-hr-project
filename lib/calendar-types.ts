export type EventType = "pto" | "holiday" | "interview"

export type EventStatus = "scheduled" | "rescheduled" | "cancelled" | "pending" | "approved" | "denied"

export type ConflictType = "hard" | "soft" | "coverage"
export type ConflictSeverity = "low" | "medium" | "high" | "critical"

export type AttendeeType = "employee" | "candidate" | "external"
export type ResponseStatus = "pending" | "accepted" | "declined" | "tentative"

export type ReminderType = "email" | "popup" | "sms"

export interface CalendarEvent {
  id?: number
  title: string
  type: EventType
  start_time: string
  end_time: string
  all_day: boolean
  description?: string
  location?: string
  status: EventStatus
  conflict_flags?: any[]
  coverage_warnings?: any[]
  google_calendar_id?: string
  google_meet_url?: string
  organizer_id?: string
  timezone?: string
  pre_buffer_minutes?: number
  post_buffer_minutes?: number
  reminder_minutes?: number
  tags?: string[]
  meta?: Record<string, any>
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarAttendee {
  id?: number
  event_id: number
  attendee_type: AttendeeType
  attendee_id?: string
  attendee_name: string
  attendee_email: string
  response_status: ResponseStatus
  response_timestamp?: string
  created_at?: string
}

export interface CalendarConflict {
  id?: number
  event_id: number
  conflicting_event_id?: number
  conflict_type: ConflictType
  severity: ConflictSeverity
  description: string
  resolved: boolean
  created_at?: string
}

export interface CalendarAuditTrail {
  id?: number
  event_id: number
  actor_id: string
  actor_name: string
  action: "created" | "updated" | "rescheduled" | "cancelled" | "approved" | "denied"
  before_state?: any
  after_state?: any
  timestamp?: string
  notes?: string
}

export interface CalendarReminder {
  id?: number
  event_id: number
  reminder_type: ReminderType
  minutes_before: number
  sent: boolean
  sent_at?: string
  created_at?: string
}

export interface PTORequest {
  id?: number
  employee_id: string
  employee_name: string
  start_date: string
  end_date: string
  reason?: string
  status: "pending" | "approved" | "rejected"
  manager_id?: string
  manager_name?: string
  manager_comment?: string
  department?: string
  days_requested?: number
  pto_balance_before?: number
  pto_balance_after?: number
  is_full_day: boolean
  start_time?: string
  end_time?: string
  calendar_event_id?: number
  created_at?: string
  updated_at?: string
}

export interface PTOAuditTrail {
  id?: number
  pto_request_id: number
  actor_id: string
  actor_name: string
  action: "submitted" | "approved" | "denied" | "modified" | "cancelled"
  before_state?: any
  after_state?: any
  timestamp?: string
  notes?: string
}

export interface BusinessHours {
  id?: number
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  is_working_day: boolean
  timezone?: string
  created_at?: string
}

export interface ConflictPolicy {
  id?: number
  policy_name: string
  policy_type: "interview" | "pto" | "general"
  conflict_type: "hard" | "soft"
  description?: string
  rules: Record<string, any>
  is_active: boolean
  created_at?: string
}

export interface InterviewSchedulingData {
  title: string
  start_time: string
  end_time: string
  candidate_id?: string
  candidate_email?: string
  candidate_name?: string
  interviewer_ids: string[]
  interviewer_emails: string[]
  generate_google_meet: boolean
  location?: string
  notes?: string
  tags?: string[]
  pre_buffer_minutes?: number
  post_buffer_minutes?: number
  reminder_minutes?: number
  timezone?: string
}

export interface PTORequestData {
  employee_id: string
  start_date: string
  end_date: string
  is_full_day: boolean
  start_time?: string
  end_time?: string
  reason?: string
  manager_id?: string
}

export interface FreeBusySlot {
  start_time: string
  end_time: string
  available: boolean
  conflict_reason?: string
}

export interface FreeBusyResponse {
  attendee_email: string
  attendee_name: string
  slots: FreeBusySlot[]
}

export interface CalendarViewMode {
  type: "month" | "week" | "day"
  title: string
  icon: string
}