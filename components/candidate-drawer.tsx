"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CheckCircle2, FileText, User, X } from "lucide-react"
import type { Candidate, CandidateStatus, CandidateStatusOption } from "@/lib/types"

type Props = {
  candidate?: Candidate | null
  statuses?: CandidateStatusOption[]
  onClose?: () => void
  onUpdated?: () => Promise<void> | void
  onStatusChange?: (candidateId: number, newStatusId: number) => Promise<void>
}

export function CandidateDrawer({ 
  candidate = null, 
  statuses = [], 
  onClose = () => {}, 
  onUpdated = async () => {},
  onStatusChange = async () => {}
}: Props) {
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setNotes(candidate?.notes || "")
  }, [candidate])

  async function updateRecommendation(rec: CandidateStatus) {
    if (!candidate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation: rec }),
      })
      if (!res.ok) {
        console.error("Failed to update recommendation", await res.text())
      }
    } finally {
      setSaving(false)
      await onUpdated()
    }
  }

  async function updateStatus(newStatusId: number) {
    if (!candidate) return
    setSaving(true)
    try {
      await onStatusChange(candidate.id, newStatusId)
    } finally {
      setSaving(false)
      await onUpdated()
    }
  }

  async function saveNotes() {
    if (!candidate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        console.error("Failed to save notes", await res.text())
      }
    } finally {
      setSaving(false)
      await onUpdated()
    }
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 7) return "default" // Green for high scores
    if (score >= 4) return "secondary" // Gray for medium scores
    return "destructive" // Red for low scores
  }

  const renderDepartmentScores = () => {
    if (!candidate?.department_specific_data) return null

    const data = candidate.department_specific_data
    const department = candidate.department

    if (department === "Operations") {
      return (
        <>
          {data.dispatch !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Dispatch</span>
              <Badge variant={getScoreBadgeVariant(data.dispatch)}>{data.dispatch}/10</Badge>
            </div>
          )}
          {data.operations_manager !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Operations Manager</span>
              <Badge variant={getScoreBadgeVariant(data.operations_manager)}>{data.operations_manager}/10</Badge>
            </div>
          )}
        </>
      )
    }

    if (department === "Safety") {
      return (
        <>
          {data.internal_safety_supervisor !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Internal Safety Supervisor</span>
              <Badge variant={getScoreBadgeVariant(data.internal_safety_supervisor)}>
                {data.internal_safety_supervisor}/10
              </Badge>
            </div>
          )}
          {data.recruiter !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Recruiter</span>
              <Badge variant={getScoreBadgeVariant(data.recruiter)}>{data.recruiter}/10</Badge>
            </div>
          )}
          {data.safety_officer !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Safety Officer</span>
              <Badge variant={getScoreBadgeVariant(data.safety_officer)}>{data.safety_officer}/10</Badge>
            </div>
          )}
          {data.recruiting_retention_officer !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Recruiting & Retention Officer</span>
              <Badge variant={getScoreBadgeVariant(data.recruiting_retention_officer)}>
                {data.recruiting_retention_officer}/10
              </Badge>
            </div>
          )}
        </>
      )
    }

    if (department === "Maintenance") {
      return (
        <>
          {data.maintenance_officer !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance Officer</span>
              <Badge variant={getScoreBadgeVariant(data.maintenance_officer)}>{data.maintenance_officer}/10</Badge>
            </div>
          )}
        </>
      )
    }

    // Billing Payroll has no specific scores
    return null
  }

  const recommendationOrder: CandidateStatus[] = ["Call Immediatley", "Remove", "Shortlist"]

  return (
    <Sheet
      open={!!candidate}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>{candidate?.name}</span>
          </SheetTitle>
        </SheetHeader>

        {!candidate ? null : (
          <div className="space-y-6 px-5 overflow-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-500">Status</span>
              {candidate.status ? (
                <Badge 
                  style={{ backgroundColor: candidate.status.color, color: 'white' }}
                >
                  {candidate.status.name}
                </Badge>
              ) : (
                <Badge variant="secondary">{candidate.recommendation}</Badge>
              )}
              {candidate.department && (
                <>
                  <span className="text-sm text-neutral-500">Department</span>
                  <Badge variant="outline">{candidate.department}</Badge>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Contact</div>
              <div className="text-sm">{candidate.email}</div>
              <div className="text-sm">{candidate.phone}</div>
              {candidate.address && <div className="text-sm">{candidate.address}</div>}
            </div>

            {candidate.department_specific_data && Object.keys(candidate.department_specific_data).length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="text-sm text-neutral-500">Department Scores</div>
                  <div className="space-y-2">{renderDepartmentScores()}</div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Strengths</div>
              <ul className="flex flex-wrap gap-2">
                {(candidate.strengths || []).map((s, i) => (
                  <li key={i} className="text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Weaknesses</div>
              <ul className="list-disc pl-5 space-y-1">
                {(candidate.weaknesses || []).map((w, i) => (
                  <li key={i} className="text-sm">
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={saveNotes} disabled={saving}>
                  Save notes
                </Button>
                <Button variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-neutral-500">Actions</div>
              
              {/* Status Change */}
              {statuses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="status-change">Change Status</Label>
                  <Select 
                    value={candidate.status_id?.toString() || ""} 
                    onValueChange={(value) => updateStatus(parseInt(value))}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Legacy Recommendation Actions */}
              <div className="grid grid-cols-2 gap-2">
                {recommendationOrder.map((rec) => (
                  <Button
                    key={rec}
                    variant={"secondary"}
                    className={"bg-neutral-100 text-neutral-900 hover:bg-neutral-200"}
                    onClick={() => updateRecommendation(rec)}
                    disabled={saving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {rec}
                  </Button>
                ))}
              </div>
              
              {candidate.cv_link && (
                <a
                  href={candidate.cv_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm text-neutral-700 hover:underline my-4"
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
