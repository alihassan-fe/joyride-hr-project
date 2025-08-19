export type CandidateStatus = "Call Immediatley" | "Remove" | "Shortlist";

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
  // new fields
  job_title?: string
  manager_id?: string
  office_location?: string
  employment_status: string
  team_id?: string
}

export interface Document {
  id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

export interface Note {
  id: number
  employee_id: string
  note: string
  note_text: string
  created_by: string
  created_at: string
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

export type OrgNode = {
  id: string
  name: string
  value: string
  children?: OrgNode[]
  symbolSize?: number
  itemStyle?: { color: string }
  label?: { show: boolean }
  category?: number
  collapsed?: boolean
}

export type Team = {
  id: string
  name: string
  department: string
  team_lead_id?: string
  location?: string
}