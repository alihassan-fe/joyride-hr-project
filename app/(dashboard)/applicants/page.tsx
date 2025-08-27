"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ExternalLink, RefreshCw, FileText, Info, Upload, Grid3X3, List, Trash2, Edit, Mail, Phone } from "lucide-react"
import { ManualUpload } from "@/components/manual-upload"
import { Input } from "@/components/ui/input" 
import { CandidateDrawer } from "@/components/candidate-drawer"
import { CandidateKanban } from "@/components/candidate-kanban"
import { CandidateEditDialog } from "@/components/candidate-edit-dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Candidate, CandidateStatusOption } from "@/lib/types"

type ViewMode = "list" | "kanban"

export default function ApplicantsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [statuses, setStatuses] = useState<CandidateStatusOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogItems, setDialogItems] = useState<string[]>([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12

  async function fetchCandidates() {
    try {
      setLoading(true)
      const res = await fetch("/api/candidates")
      const data = await res.json()
      setCandidates(data ?? [])
    } catch (error) {
      setError("Failed to fetch candidates")
      console.error("Error fetching candidates:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStatuses() {
    try {
      const res = await fetch("/api/candidate-statuses")
      const data = await res.json()
      setStatuses(data ?? [])
    } catch (error) {
      console.error("Error fetching statuses:", error)
    }
  }

  useEffect(() => {
    fetchCandidates()
    fetchStatuses()
  }, [])

  const filteredCandidates = candidates.filter((c) => {
    const searchMatch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())

    if (!searchMatch) return false

    if (statusFilter !== "all") {
      if (c.status_id?.toString() !== statusFilter) return false
    }

    if (departmentFilter !== "all") {
      if ((c.department || "").toLowerCase() !== departmentFilter.toLowerCase()) return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE)
  const paginatedCandidates = filteredCandidates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const departments = ["Operations", "Maintenance", "Safety", "Billing Payroll"]

  function openListDialog(title: string, items: string[] = []) {
    setDialogTitle(title)
    setDialogItems(items)
    setDialogOpen(true)
  }

  async function handleStatusChange(candidateId: number, newStatusId: number) {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: newStatusId }),
      })
      if (!res.ok) {
        throw new Error("Failed to update status")
      }
      await fetchCandidates()
    } catch (error) {
      console.error("Error updating status:", error)
      throw error
    }
  }

  async function handleDeleteCandidate(candidateId: number) {
    if (!confirm("Are you sure you want to delete this candidate?")) {
      return
    }

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete candidate")
      }
      await fetchCandidates()
    } catch (error) {
      console.error("Error deleting candidate:", error)
      alert("Failed to delete candidate")
    }
  }

  async function handleEditCandidate(candidateId: number, updates: Partial<Candidate>) {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        throw new Error("Failed to update candidate")
      }
      await fetchCandidates()
    } catch (error) {
      console.error("Error updating candidate:", error)
      throw error
    }
  }



  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Applicants</h1>
          <p className="text-sm text-neutral-500">Manage candidate applications</p>
        </div>
        <div className="flex items-center gap-2">
          <ManualUpload onAdded={fetchCandidates} />
          <Button variant="outline" onClick={fetchCandidates} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>



      {/* Error state */}
      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">Failed to load applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="w-full grid grid-cols-4 gap-5">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value="all">All Statuses</SelectItem>
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
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={departmentFilter}
          onValueChange={(value) => {
            setDepartmentFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Department</SelectLabel>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <CandidateKanban
          candidates={filteredCandidates}
          statuses={statuses}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteCandidate}
          onEdit={openEditDialog}
          onView={setSelected}
        />
      ) : (
        /* List View */
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto w-full max-w-[1190px]">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Name</TableHead>
                    <TableHead className="min-w-[200px] whitespace-nowrap">Email</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Phone</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Department</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Status</TableHead>
                    <TableHead className="min-w-[80px] whitespace-nowrap">CV</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Strengths</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Weaknesses</TableHead>
                    <TableHead className="min-w-[200px]">Notes</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="min-w-[150px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[140px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[200px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[180px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[120px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[100px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[80px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[60px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[80px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[80px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[60px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[80px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[80px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="h-4 w-full max-w-[180px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[100px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading &&
                    paginatedCandidates.map((c) => (
                      <TableRow key={c.id} className="hover:bg-neutral-50">
                        <TableCell className="font-medium min-w-[150px] whitespace-nowrap" onClick={() => setSelected(c)}>
                          {c.name}
                        </TableCell>
                        <TableCell className="text-neutral-600 min-w-[200px] whitespace-nowrap">{c.email}</TableCell>
                        <TableCell className="text-neutral-600 min-w-[120px] whitespace-nowrap">{c.phone}</TableCell>
                        <TableCell className="min-w-[120px] whitespace-nowrap">
                          {c.department ? (
                            <Badge variant="outline" className="text-xs">
                              {c.department}
                            </Badge>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[120px] whitespace-nowrap">
                          {c.status ? (
                            <Badge 
                              style={{ backgroundColor: c.status.color, color: 'white' }}
                              className="text-xs"
                            >
                              {c.status.name}
                            </Badge>
                          ) : (
                            <RecommendationBadge value={c.recommendation ?? ""} />
                          )}
                        </TableCell>
                        <TableCell className="min-w-[80px] whitespace-nowrap">
                          {c.cv_link ? (
                            <a
                              href={c.cv_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm text-neutral-700 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              Open
                              <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            </a>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openListDialog(`Strengths — ${c.name}`, c.strengths || [])}
                            disabled={!c.strengths || c.strengths.length === 0}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openListDialog(`Weaknesses — ${c.name}`, c.weaknesses || [])}
                            disabled={!c.weaknesses || c.weaknesses.length === 0}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          {c.notes ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 max-w-[180px] truncate cursor-help">
                                    <Info className="h-3.5 w-3.5 text-neutral-500" />
                                    <span className="text-neutral-700">{c.notes}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{c.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[120px] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelected(c)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(c)}
                              className="h-8 w-8 p-0"
                              title="Edit Candidate"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`mailto:${c.email}`, '_blank')}
                              className="h-8 w-8 p-0"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`tel:${c.phone}`, '_blank')}
                              className="h-8 w-8 p-0"
                              title="Call Candidate"
                              disabled={!c.phone}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCandidate(c.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              title="Delete Candidate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && candidates.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-sm text-neutral-500">
                        No applicants found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for strengths/weaknesses */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>Click outside to close</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {dialogItems.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {dialogItems.map((item, idx) => (
                  <li key={idx} className="text-sm text-neutral-800">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No items.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Drawer */}
      <CandidateDrawer
        candidate={selected}
        statuses={statuses}
        onClose={() => setSelected(null)}
        onUpdated={async () => { await fetchCandidates(); }}
        onStatusChange={handleStatusChange}
      />

      {/* Candidate Edit Dialog */}
      <CandidateEditDialog
        candidate={editingCandidate}
        statuses={statuses}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingCandidate(null)
        }}
        onSave={handleEditCandidate}
      />
    </div>
  )
}

function RecommendationBadge({ value }: { value?: string }) {
  const v = (value || "").toLowerCase()

  if (v === "remove") {
    return <Badge variant="destructive">Remove</Badge>
  }

  if (v === "call immediately") {
    return (
      <Badge className="bg-emerald-100 text-emerald-900" variant="secondary">
        Consider
      </Badge>
    )
  }

  if (v === "shortlist") {
    return (
      <Badge className="bg-blue-100 text-blue-900" variant="secondary">
        Shortlist
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-neutral-100 text-neutral-800">
      —
    </Badge>
  )
}
