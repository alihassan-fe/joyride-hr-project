"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, User, Trash2, Edit, ExternalLink, Mail, Phone } from "lucide-react"
import { Candidate, CandidateStatusOption } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KanbanColumn {
  status: CandidateStatusOption
  candidates: Candidate[]
}

interface Props {
  candidates: Candidate[]
  statuses: CandidateStatusOption[]
  onStatusChange: (candidateId: number, newStatusId: number) => Promise<void>
  onDelete: (candidateId: number) => Promise<void>
  onEdit: (candidate: Candidate) => void
  onView: (candidate: Candidate) => void
}

export function CandidateKanban({ 
  candidates, 
  statuses, 
  onStatusChange, 
  onDelete, 
  onEdit, 
  onView 
}: Props) {
  const [draggedCandidate, setDraggedCandidate] = React.useState<Candidate | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  // Group candidates by status
  const columns: KanbanColumn[] = statuses.map(status => ({
    status,
    candidates: candidates.filter(c => c.status_id === status.id)
  }))

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggedCandidate(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetStatusId: number) => {
    e.preventDefault()
    
    if (!draggedCandidate || draggedCandidate.status_id === targetStatusId) {
      return
    }

    try {
      await onStatusChange(draggedCandidate.id, targetStatusId)
    } catch (error) {
      console.error("Failed to update candidate status:", error)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto w-full max-w-[1190px] pb-4">
      {columns.map((column) => (
        <div
          key={column.status.id}
          className={cn(
            "flex-shrink-0 w-80",
            isDragging && "opacity-50"
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.status.id)}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: column.status.color }}
                  />
                  <span>{column.status.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {column.candidates.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2">
                  {column.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "p-3 border rounded-lg bg-white cursor-move hover:shadow-sm transition-shadow",
                        draggedCandidate?.id === candidate.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-neutral-500" />
                          <span className="font-medium text-sm">{candidate.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(candidate)}
                            className="h-6 w-6 p-0"
                            title="View Details"
                          >
                            <User className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(candidate)}
                            className="h-6 w-6 p-0"
                            title="Edit Candidate"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`mailto:${candidate.email}`, '_blank')}
                            className="h-6 w-6 p-0"
                            title="Send Email"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`tel:${candidate.phone}`, '_blank')}
                            className="h-6 w-6 p-0"
                            title="Call Candidate"
                            disabled={!candidate.phone}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(candidate.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Delete Candidate"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-neutral-600">
                        <div>{candidate.email}</div>
                        {candidate.phone && <div>{candidate.phone}</div>}
                        {candidate.department && (
                          <Badge variant="outline" className="text-xs">
                            {candidate.department}
                          </Badge>
                        )}
                      </div>

                      {candidate.cv_link && (
                        <div className="mt-2">
                          <a
                            href={candidate.cv_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-neutral-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View CV
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}

                      {candidate.notes && (
                        <div className="mt-2 text-xs text-neutral-500">
                          <div className="truncate">{candidate.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {column.candidates.length === 0 && (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                      No candidates
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
