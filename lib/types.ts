export type CandidateStatus = "New" | "Reviewed" | "Shortlisted" | "Interview" | "Hired" | "Rejected"

export type Job = {
  id: string
  title: string
  description?: string
  requirements?: string[]
}

export type Candidate = {
  id: string
  name: string
  email: string
  phone: string
  cv_url?: string
  status: CandidateStatus
  scores?: { overall?: number; [k: string]: number | undefined }
  applied_job_id?: string
  job_title?: string
  skills?: string[]
  work_history?: string[]
  notes?: string
  created_at?: string
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
