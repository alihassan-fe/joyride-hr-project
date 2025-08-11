export type EventType = "pto" | "holiday" | "interview"

export type CalendarEvent = {
  id: number
  title: string
  type: EventType
  start_time: string // ISO
  end_time: string // ISO
  all_day: boolean
  created_by?: string | null
}

export type PTOStatus = "pending" | "approved" | "rejected"

export type PTORequest = {
  id: number
  employee_id: string
  employee_name: string
  start_date: string // ISO
  end_date: string // ISO
  reason?: string | null
  status: PTOStatus
  manager_id?: string | null
  manager_comment?: string | null
  created_at: string
}
