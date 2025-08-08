"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"
import type { Job } from "@/lib/types"
import { FileUp, Plus } from 'lucide-react'

type Props = {
  onAdded?: () => void
}

export function ManualUpload({ onAdded = () => {} }: Props) {
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobId, setJobId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/jobs").then(r => r.json()).then(j => setJobs(j.data || []))
  }, [])

  async function handleUpload() {
    if (!file || !jobId) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    form.append("applied_job_id", jobId)
    const res = await fetch("/api/parse-cv", { method: "POST", body: form })
    const parsed = await res.json()
    if (!res.ok) {
      alert(parsed.error || "Parse failed")
      setUploading(false)
      return
    }
    const createRes = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    if (createRes.ok) {
      setOpen(false)
      setFile(null)
      setJobId("")
      onAdded()
    } else {
      const j = await createRes.json()
      alert(j.error || "Failed to create candidate")
    }
    setUploading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual CV Upload</DialogTitle>
          <DialogDescription>Upload a PDF resume. The backend will parse it and create a candidate.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>CV (PDF)</Label>
            <Input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleUpload} disabled={!file || !jobId || uploading}>
            <FileUp className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload and Parse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
