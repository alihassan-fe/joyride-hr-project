"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Candidate, CandidateStatus, Job } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CheckCircle2, FileText, User, X } from 'lucide-react'

type Props = {
  candidate?: Candidate | null
  jobs?: Job[]
  onClose?: () => void
  onUpdated?: () => Promise<void> | void
}

export function CandidateDrawer({
  candidate = null,
  jobs = [],
  onClose = () => {},
  onUpdated = async () => {},
}: Props) {
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setNotes(candidate?.notes || "")
  }, [candidate])

  async function updateStatus(status: CandidateStatus) {
    if (!candidate) return
    setSaving(true)
    await fetch(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setSaving(false)
    await onUpdated()
  }

  async function saveNotes() {
    if (!candidate) return
    setSaving(true)
    await fetch(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    })
    setSaving(false)
    await onUpdated()
  }

  const statusOrder: CandidateStatus[] = ["New","Reviewed","Shortlisted","Interview","Hired","Rejected"]

  return (
    <Sheet open={!!candidate} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>{candidate?.name}</span>
          </SheetTitle>
        </SheetHeader>
        {!candidate ? null : (
          <div className="mt-4 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-500">Status</span>
              <Badge variant="secondary">{candidate.status}</Badge>
              <span className="text-sm text-neutral-500">Score</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">{candidate.scores?.overall ?? "-"}</Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-500">Applied for</span>
              <span className="text-sm">
                {jobs.find(j => j.id === candidate.applied_job_id)?.title ?? "-"}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Contact</div>
              <div className="text-sm">{candidate.email}</div>
              <div className="text-sm">{candidate.phone}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Skills</div>
              <div className="flex flex-wrap gap-2">
                {(candidate.skills || []).map((s, i) => (
                  <Badge key={i} className="bg-neutral-100 text-neutral-800" variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Work History</div>
              <ul className="list-disc pl-5 space-y-1">
                {(candidate.work_history || []).map((w, i) => (
                  <li key={i} className="text-sm">{w}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={saveNotes} disabled={saving}>Save notes</Button>
                <Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-2" />Close</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Actions</div>
              <div className="grid grid-cols-2 gap-2">
                {statusOrder.map((s) => (
                  <Button
                    key={s}
                    variant={s === "Rejected" ? "destructive" : "secondary"}
                    className={cn(s !== "Rejected" ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200" : "")}
                    onClick={() => updateStatus(s)}
                    disabled={saving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {s}
                  </Button>
                ))}
              </div>
              {candidate.cv_url && (
                <a
                  href={candidate.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm text-neutral-700 hover:underline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View original CV
                </a>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
