"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Filter, Search, Upload } from 'lucide-react'
import type { Candidate, CandidateStatus, Job } from "@/lib/types"
import { CandidateDrawer } from "@/components/candidate-drawer"
import { ManualUpload } from "@/components/manual-upload"

type Filters = {
  q: string
  status: CandidateStatus | "All"
  minScore: number
  jobId: string | "All"
}

const defaultFilters: Filters = { q: "", status: "All", minScore: 0, jobId: "All" }

export default function ApplicantsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [candRes, jobsRes] = await Promise.all([fetch("/api/candidates"), fetch("/api/jobs")])
    const c = await candRes.json()
    const j = await jobsRes.json()
    setCandidates(c.data || [])
    setJobs(j.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (filters.status !== "All" && c.status !== filters.status) return false
      if (filters.jobId !== "All" && c.applied_job_id !== filters.jobId) return false
      const score = typeof c.scores?.overall === "number" ? c.scores!.overall : 0
      if (score < filters.minScore) return false
      const q = filters.q.toLowerCase()
      if (q) {
        const blob = `${c.name} ${c.email} ${c.phone} ${c.skills?.join(" ")} ${c.job_title || ""}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [candidates, filters])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Applicants</h1>
          <p className="text-sm text-neutral-500">Search, filter, and manage candidates</p>
        </div>
        <div className="flex items-center gap-2">
          <ManualUpload onAdded={async () => load()} />
          <Button variant="outline" onClick={() => load()}>
            <Upload className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <div className="md:col-span-2">
              <Label className="sr-only">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search name, email, skills..."
                  className="pl-8"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="sr-only">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ ...filters, status: v as Filters["status"] })}
              >
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {["All","New","Reviewed","Shortlisted","Interview","Hired","Rejected"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="sr-only">Min Score</Label>
              <Select
                value={String(filters.minScore)}
                onValueChange={(v) => setFilters({ ...filters, minScore: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Min Score" /></SelectTrigger>
                <SelectContent>
                  {[0,3,5,7,8,9].map((n) => (
                    <SelectItem key={n} value={String(n)}>{`Score ≥ ${n}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="sr-only">Job</Label>
              <Select
                value={filters.jobId}
                onValueChange={(v) => setFilters({ ...filters, jobId: v as Filters["jobId"] })}
              >
                <SelectTrigger><SelectValue placeholder="Job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3 text-neutral-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm">{filtered.length} of {candidates.length} candidates</span>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => setSelected(c)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>{c.scores?.overall ?? "-"}</TableCell>
                    <TableCell>{jobs.find(j => j.id === c.applied_job_id)?.title ?? "-"}</TableCell>
                    <TableCell>{new Date(c.created_at || Date.now()).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5}>No candidates match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">n8n ingestion (demo)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          Configure your n8n workflow to POST parsed CV JSON to <code className="bg-neutral-100 px-1 rounded">/api/n8n/ingest</code>.
          This page will reflect newly added candidates automatically.
        </CardContent>
      </Card>

      <CandidateDrawer
        candidate={selected}
        jobs={jobs}
        onClose={() => setSelected(null)}
        onUpdated={async () => { await load(); }}
      />
    </div>
  )
}

function StatusBadge({ status = "New" as CandidateStatus }) {
  const map: Record<CandidateStatus, { label: string, className: string }> = {
    New: { label: "New", className: "bg-neutral-100 text-neutral-700" },
    Reviewed: { label: "Reviewed", className: "bg-amber-100 text-amber-900" },
    Shortlisted: { label: "Shortlisted", className: "bg-emerald-100 text-emerald-900" },
    Interview: { label: "Interview", className: "bg-purple-100 text-purple-900" },
    Hired: { label: "Hired", className: "bg-green-100 text-green-900" },
    Rejected: { label: "Rejected", className: "bg-rose-100 text-rose-900" },
  }
  const cfg = map[status]
  return <Badge className={`${cfg.className} font-normal`} variant="secondary">{cfg.label}</Badge>
}
