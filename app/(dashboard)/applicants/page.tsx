"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ExternalLink, RefreshCw, FileText, Info } from "lucide-react"
import { ManualUpload } from "@/components/manual-upload"
import { Input } from "@/components/ui/input"
import { CandidateDrawer } from "@/components/candidate-drawer"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Candidate } from "@/lib/types"

// Use the same webhook as the Dashboard
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN}/webhook/candidates`

export default function ApplicantsPage() {
  const [data, setData] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [recommendationFilter, setRecommendationFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Candidate | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogItems, setDialogItems] = useState<string[]>([])

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  async function fetchData() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(WEBHOOK_URL, { cache: "no-store" })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
      const json = (await res.json()) as Candidate[] | { data: Candidate[] }
      const arr = Array.isArray(json) ? json : (json as any).data
      if (!Array.isArray(arr)) throw new Error("Unexpected response shape")
      setData(arr.length > 0 ? arr : [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch applicants")
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = data.filter((c) => {
    const searchMatch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())

    if (!searchMatch) return false

    if (recommendationFilter !== "all") {
      if ((c.recommendation || "").toLowerCase() !== recommendationFilter) return false
    }

    if (departmentFilter !== "all") {
      if ((c.department || "").toLowerCase() !== departmentFilter.toLowerCase()) return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const departments = Array.from(new Set(data.map((c) => c.department).filter(Boolean)))

  function openListDialog(title: string, items: string[] = []) {
    setDialogTitle(title)
    setDialogItems(items)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Applicants</h1>
          <p className="text-sm text-neutral-500">Listing all applicants</p>
        </div>
        <div className="flex items-center gap-2">
          <ManualUpload onAdded={fetchData} />
          <Button variant="outline" onClick={fetchData} disabled={loading}>
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

      {/* Search and filters */}
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
          value={recommendationFilter}
          onValueChange={(value) => {
            setRecommendationFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="All Recommendations" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Recommendation</SelectLabel>
              <SelectItem value="all">All Recommendations</SelectItem>
              <SelectItem value="remove">Remove</SelectItem>
              <SelectItem value="call immediately">Consider</SelectItem>
              <SelectItem value="shortlist">Shortlist</SelectItem>
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
                <SelectItem key={dept} value={dept!}>
                  {dept}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Applicants Table */}
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
                  <TableHead className="min-w-[80px] whitespace-nowrap">Dispatch</TableHead>
                  <TableHead className="min-w-[100px] whitespace-nowrap">Ops Manager</TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap">Recommendation</TableHead>
                  <TableHead className="min-w-[80px] whitespace-nowrap">CV</TableHead>
                  <TableHead className="min-w-[100px] whitespace-nowrap">Strengths</TableHead>
                  <TableHead className="min-w-[100px] whitespace-nowrap">Weaknesses</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
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
                      <TableCell className="min-w-[120px] whitespace-nowrap">
                        <div className="h-4 w-full max-w-[100px] rounded bg-neutral-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="min-w-[80px] whitespace-nowrap">
                        <div className="h-4 w-full max-w-[60px] rounded bg-neutral-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="min-w-[100px] whitespace-nowrap">
                        <div className="h-4 w-full max-w-[80px] rounded bg-neutral-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="min-w-[120px] whitespace-nowrap">
                        <div className="h-4 w-full max-w-[60px] rounded bg-neutral-100 animate-pulse" />
                      </TableCell>
                      <TableCell className="min-w-[80px] whitespace-nowrap">
                        <div className="h-4 w-full max-w-[80px] rounded bg-neutral-100 animate-pulse" />
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
                    </TableRow>
                  ))}
                {!loading &&
                  paginatedData.map((c) => (
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
                      <TableCell className="min-w-[80px] whitespace-nowrap">
                        {typeof c.dispatch === "number" ? c.dispatch : "-"}
                      </TableCell>
                      <TableCell className="min-w-[100px] whitespace-nowrap">
                        {typeof c.operationsManager === "number" ? c.operationsManager : "-"}
                      </TableCell>
                      <TableCell className="min-w-[120px] whitespace-nowrap">
                        <RecommendationBadge value={c.recommendation} />
                      </TableCell>
                      <TableCell className="min-w-[80px] whitespace-nowrap">
                        {c.cvLink ? (
                          <a
                            href={c.cvLink}
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
                    </TableRow>
                  ))}
                {!loading && data.length === 0 && !error && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-sm text-neutral-500">
                      No applicants found from the webhook.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
      <CandidateDrawer
        candidate={selected}
        onClose={() => setSelected(null)}
        onUpdated={async () => {
          await fetchData()
        }}
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
