export type EventType = | "holiday" | "interview"

export type CalendarEvent = {
  id: number
  title: string
  type: EventType
  start_time: string // ISO
  end_time: string // ISO
  all_day: boolean
  created_by?: string | null
}