export type CandidateStatus = "Call Immediatley" | "Remove" | "Shortlist"

export type Job = {
  id: string
  title: string
  description?: string
  requirements?: string[]
}

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
  recommendation?: string // 'Remove' | 'Consider' | undefined
}

export type Employee = {
  id: string
  name: string
  email: string
  role: string
  start_date: string
  pto_balance: number
}

export type Event = {
  id: string
  type: string
  title: string
  start: string
  end: string
  owner_id?: string
}
