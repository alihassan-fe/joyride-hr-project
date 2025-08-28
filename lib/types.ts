export type CandidateStatus = "Call Immediatley" | "Remove" | "Shortlist";

// New types for candidate status management
export interface CandidateStatusOption {
  id: number
  name: string
  color: string
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Candidate = {
  id: number
  name: string
  email: string
  phone: string
  address?: string
  cv_link: string | null
  cvLink?: string // <CHANGE> backward compatibility
  dispatch: number | null
  operations_manager: number | null
  operationsManager?: number // <CHANGE> backward compatibility
  strengths: string[] | null
  weaknesses: string[] | null
  notes: string | null
  recommendation: CandidateStatus | null
  created_at: string
  department: string | null
  // New fields for status management
  status_id?: number
  status?: CandidateStatusOption
  department_specific_data?: {
    // Operations department
    dispatch?: number
    operations_manager?: number
    // Maintenance department
    maintenance_officer?: number
    // Safety department
    internal_safety_supervisor?: number
    recruiter?: number
    safety_officer?: number
    recruiting_retention_officer?: number
    // Billing Payroll has no specific fields
  } | null
}

// Enhanced Employee interface with all new fields
export interface Employee {
  id: string
  name: string
  email: string
  role: string
  start_date: string
  pto_balance: number
  location?: string
  phone?: string
  department?: string
  document_count?: number
  notes_count?: number
  // Enhanced profile fields
  first_name?: string
  last_name?: string
  age?: number
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say'
  address?: string
  city?: string
  state?: string
  zip_code?: string
  client_id?: string
  manager_id?: string
  employment_status?: 'Active' | 'Inactive' | 'Archived' | 'Terminated'
  archived_at?: string
  archived_by?: string
  updated_at?: string
  // Legacy fields for backward compatibility
  job_title?: string
  location?: string
  team_id?: string
  current_performance_score?: number
  // Manager information
  manager?: Employee
  // Client information
  client?: Client
}

// New types for enhanced employee system
export interface Client {
  id: number
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface Department {
  id: number
  name: string
  description?: string
  client_id?: number
  is_active: boolean
  created_at: string
}

export interface EmployeeDocumentCategory {
  id: number
  name: string
  description?: string
  max_files: number
  max_file_size_mb: number
  is_required: boolean
  sort_order: number
  created_at: string
}

// Enhanced Document interface
export interface Document {
  id: number
  employee_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
  // New fields
  category_id?: number
  uploaded_by?: string
  file_type?: string
  is_verified?: boolean
  verified_by?: string
  verified_at?: string
  // Related data
  category?: EmployeeDocumentCategory
  uploader?: Employee
  verifier?: Employee
}

export interface EmployeeKPI {
  id: number
  employee_id: string
  kpi_name: string
  kpi_description?: string
  target_value?: number
  current_value?: number
  unit?: string
  is_department_default: boolean
  department_id?: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // Related data
  department?: Department
  creator?: Employee
  scores?: EmployeeKPIScore[]
}

export interface EmployeeKPIScore {
  id: number
  kpi_id: number
  employee_id: string
  score: number
  score_date: string
  comment?: string
  document_path?: string
  created_by?: string
  created_at: string
  // Related data
  kpi?: EmployeeKPI
  creator?: Employee
}

export interface EmployeeActivityLog {
  id: number
  employee_id: string
  actor_id: string
  action_type: 'profile_updated' | 'document_uploaded' | 'document_deleted' | 'note_added' | 
               'note_updated' | 'note_deleted' | 'performance_updated' | 'kpi_added' | 
               'kpi_updated' | 'kpi_score_added' | 'pto_requested' | 'pto_approved' | 
               'pto_rejected' | 'employee_archived' | 'employee_restored' | 'meeting_scheduled'
  action_details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  // Actor information from users table
  actor_name?: string
  actor_email?: string
  // Related data
  employee?: Employee
  actor?: Employee
}

export interface EmployeeMeeting {
  id: number
  employee_id: string
  meeting_type: 'HR_Review' | 'Performance_Review' | 'Disciplinary' | 'Onboarding' | 'Exit_Interview' | 'Other'
  title: string
  description?: string
  scheduled_date: string
  duration_minutes: number
  location?: string
  google_meet_url?: string
  google_calendar_id?: string
  attendees?: any[]
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Related data
  employee?: Employee
  creator?: Employee
}

// New types for employee performance tracking
export interface EmployeePerformance {
  id: number
  employee_id: string
  score: number
  performance_date: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  documents?: EmployeePerformanceDocument[]
}

export interface EmployeePerformanceDocument {
  id: number
  performance_id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

// New types for shift management
export interface ShiftType {
  id: number
  name: string
  start_time: string
  end_time: string
  color: string
  description?: string
  created_at: string
}

export interface EmployeeShift {
  id: number
  employee_id: string
  shift_type_id: number
  shift_date: string
  notes?: string
  assigned_by?: string
  created_at: string
  updated_at: string
  // Related data
  employee?: Employee
  shift_type?: ShiftType
  assigner?: Employee
}

// Calendar types
export type EventType = "interview" | "pto" | "holiday" | "meeting" | "other"

export type EventStatus = "scheduled" | "rescheduled" | "cancelled" | "pending" | "approved" | "denied"

export type ConflictType = "hard" | "soft" | "coverage"

export type AttendeeType = "employee" | "candidate" | "external"

export type ResponseStatus = "pending" | "accepted" | "declined" | "tentative"

export type ReminderType = "email" | "popup" | "sms"

export interface CalendarEvent {
  id: number
  title: string
  type: EventType
  start_time: string
  end_time: string
  all_day: boolean
  description?: string
  location?: string
  meta?: any
  status: EventStatus
  conflict_flags?: any[]
  coverage_warnings?: any[]
  google_calendar_id?: string
  google_meet_url?: string
  organizer_id?: string
  timezone: string
  pre_buffer_minutes: number
  post_buffer_minutes: number
  reminder_minutes: number
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
  attendees?: CalendarAttendee[]
}

export interface CalendarAttendee {
  id: number
  event_id: number
  attendee_type: AttendeeType
  attendee_id?: string
  attendee_name: string
  attendee_email: string
  response_status: ResponseStatus
  response_timestamp?: string
  created_at: string
}

export interface CalendarConflict {
  id: number
  event_id: number
  conflicting_event_id?: number
  conflict_type: ConflictType
  severity: "low" | "medium" | "high" | "critical"
  description: string
  resolved: boolean
  created_at: string
}

export interface CalendarAuditTrail {
  id: number
  event_id: number
  actor_id: string
  actor_name: string
  action: "created" | "updated" | "rescheduled" | "cancelled" | "approved" | "denied"
  before_state?: any
  after_state?: any
  timestamp: string
  notes?: string
}

export interface CalendarReminder {
  id: number
  event_id: number
  reminder_type: ReminderType
  minutes_before: number
  sent: boolean
  sent_at?: string
  created_at: string
}

export interface PTORequest {
  id: number
  employee_id: string
  employee_name: string
  start_date: string
  end_date: string
  reason?: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  manager_id?: string
  manager_name?: string
  manager_comment?: string
  department?: string
  days_requested: number
  pto_balance_before: number
  pto_balance_after: number
  is_full_day: boolean
  start_time?: string
  end_time?: string
  calendar_event_id?: number
  created_at: string
  updated_at: string
}

export interface PTOAuditTrail {
  id: number
  pto_request_id: number
  actor_id: string
  actor_name: string
  action: "submitted" | "approved" | "denied" | "modified" | "cancelled"
  before_state?: any
  after_state?: any
  timestamp: string
  notes?: string
}

export interface BusinessHours {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  is_working_day: boolean
  timezone: string
  created_at: string
}

export interface ConflictPolicy {
  id: number
  policy_name: string
  policy_type: "interview" | "pto" | "general"
  conflict_type: "hard" | "soft"
  description?: string
  rules: any
  is_active: boolean
  created_at: string
}

// API request/response types
export interface InterviewSchedulingData {
  title: string
  type: "interview"
  start_time: string
  end_time: string
  all_day: boolean
  description?: string
  location?: string
  timezone: string
  organizer_id?: string
  pre_buffer_minutes: number
  post_buffer_minutes: number
  reminder_minutes: number
  tags: string[]
  attendees: CalendarAttendee[]
  generate_google_meet: boolean
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

export type CalendarViewMode = "month" | "week" | "day"

// Search result type
export interface SearchResult {
  type: "candidate" | "employee"
  id: string
  name: string
  email: string
  department?: string
  role?: string
}

// Note type
export interface Note {
  id: number
  employee_id: string
  note: string
  note_text?: string
  created_by?: string
  created_at: string
}

// Team type for org chart
export interface Team {
  id: string
  name: string
  department: string
  team_lead_id?: string
  location?: string
}

// OrgNode type for organizational chart
export interface OrgNode {
  id: string
  name: string
  value: string
  symbolSize: number
  itemStyle: {
    color: string
    borderColor?: string
    borderWidth?: number
  }
  category: number
  children?: OrgNode[]
}

// Outbox item type for calendar notifications
export interface OutboxItem {
  id: string
  status: string
  title?: string
  created_at?: string
}