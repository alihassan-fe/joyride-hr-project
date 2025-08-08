import type { Candidate, Employee, Event, Job } from "./types"
import { nanoid } from "nanoid"

function nowISO() { return new Date().toISOString() }

type Store<T extends { id: string }> = {
  list: () => T[]
  get: (id: string) => T | undefined
  create: (partial: Omit<Partial<T>, "id"> & Record<string, any>) => T
  update: (id: string, patch: Partial<T>) => T | undefined
}

function createStore<T extends { id: string }>(seed: T[] = []): Store<T> {
  const arr: T[] = [...seed]
  return {
    list: () => arr.slice(),
    get: (id) => arr.find((x) => x.id === id),
    create: (partial) => {
      const item = { id: nanoid(10), ...partial } as T
      arr.unshift(item)
      return item
    },
    update: (id, patch) => {
      const i = arr.findIndex((x) => x.id === id)
      if (i === -1) return undefined
      arr[i] = { ...arr[i], ...patch }
      return arr[i]
    }
  }
}

const jobsSeed: Job[] = [
  { id: "job-fe", title: "Frontend Engineer", description: "React, TypeScript, UI", requirements: ["React","TypeScript","CSS"] },
  { id: "job-be", title: "Backend Engineer", description: "Node.js, SQL", requirements: ["Node.js","SQL","API"] },
  { id: "job-hr", title: "HR Generalist" },
]

const candidatesSeed: Candidate[] = [
  {
    id: "cand-1",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 555-0101",
    status: "Reviewed",
    scores: { overall: 7 },
    applied_job_id: "job-fe",
    job_title: "Frontend Engineer",
    skills: ["React","TypeScript","Tailwind"],
    work_history: ["UI Engineer at Pixel Co (2022-2024)","Frontend Dev at Webify (2020-2022)"],
    created_at: nowISO(),
  },
  {
    id: "cand-2",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 555-0102",
    status: "Shortlisted",
    scores: { overall: 8 },
    applied_job_id: "job-be",
    job_title: "Backend Engineer",
    skills: ["Node.js","PostgreSQL","Express"],
    work_history: ["Backend Engineer at API Corp (2021-2024)"],
    created_at: nowISO(),
  },
  {
    id: "cand-3",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 555-0103",
    status: "New",
    scores: { overall: 6 },
    applied_job_id: "job-fe",
    job_title: "Frontend Engineer",
    skills: ["JavaScript","CSS","Testing"],
    work_history: ["Intern at Designify (2023-2024)"],
    created_at: nowISO(),
  }
]

const employeesSeed: Employee[] = [
  { id: "emp-1", name: "Alice Johnson", email: "alice@acme.hr", role: "HR Manager", start_date: "2021-05-10", pto_balance: 12 },
  { id: "emp-2", name: "Bob Lee", email: "bob@acme.hr", role: "Recruiter", start_date: "2022-02-01", pto_balance: 8 },
  { id: "emp-3", name: "Carlos Gomez", email: "carlos@acme.hr", role: "Marketing", start_date: "2020-09-15", pto_balance: 14 },
]

const eventsSeed: Event[] = [
  { id: "evt-1", type: "PTO", title: "Alice PTO", start: "2025-08-20", end: "2025-08-25", owner_id: "emp-1" },
]

export const db = {
  jobs: createStore<Job>(jobsSeed),
  candidates: createStore<Candidate>(candidatesSeed),
  employees: createStore<Employee>(employeesSeed),
  events: createStore<Event>(eventsSeed),
}
