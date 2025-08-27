"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExternalLink, RefreshCw, FileText, Info, ArrowRight, Building2 } from "lucide-react"
import { Candidate, OutboxItem } from "@/lib/types"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface DepartmentMetrics {
  name: string
  candidates: {
    total: number
    callImmediately: number
    remove: number
    shortlist: number
    recent: any[]
  }
  employees: {
    total: number
    avgPerformance: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<Candidate[]>([])
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([])
  const [loading, setLoading] = useState(false)
  const [departmentLoading, setDepartmentLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogItems, setDialogItems] = useState<string[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [outbox, setOutbox] = useState<OutboxItem[]>([])
  const [outboxLoading, setOutboxLoading] = useState(false)

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch("/api/candidates")
      const data = await res.json()
      setData(data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function fetchDepartmentMetrics() {
    try {
      setDepartmentLoading(true)
      const res = await fetch("/api/dashboard/department-metrics")
      if (!res.ok) throw new Error("Failed to load department metrics")
      const json = await res.json()
      console.log("json", json)
      setDepartmentMetrics(json.data || [])
    } catch (error) {
      console.error("Error fetching department metrics:", error)
      setError("Failed to load department metrics")
    } finally {
      setDepartmentLoading(false)
    }
  }

  async function fetchEvents() {
    setEventsLoading(true)
    try {
      const res = await fetch("/api/calendar/events", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load events")
      const json = await res.json()
      const arr = Array.isArray(json) ? json : json.data || []
      // Sort by start_time and get upcoming events
      const upcoming = arr
        .filter((event: any) => new Date(event.start_time) >= new Date())
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      setEvents(upcoming)
    } catch {
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  async function fetchOutbox() {
    setOutboxLoading(true)
    try {
      const res = await fetch("/api/calendar/outbox", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load outbox")
      const json = await res.json()
      const arr = Array.isArray(json) ? json : json.data || []
      setOutbox(arr.slice(0, 5)) // Latest 5 notifications
    } catch {
      setOutbox([])
    } finally {
      setOutboxLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchDepartmentMetrics()
    fetchEvents()
    fetchOutbox()
  }, [])

  function openListDialog(title: string, items: string[] = []) {
    setDialogTitle(title)
    setDialogItems(items)
    setDialogOpen(true)
  }

  const truncate = (str: string, max: number) =>
    str.length > max ? str.slice(0, max) + "..." : str

  // Overall stats across all departments
  const overallStats = useMemo(() => {
    const totalCandidates = departmentMetrics.reduce((sum, dept) => sum + dept.candidates.total, 0)
    const totalCallImmediately = departmentMetrics.reduce((sum, dept) => sum + dept.candidates.callImmediately, 0)
    const totalRemove = departmentMetrics.reduce((sum, dept) => sum + dept.candidates.remove, 0)
    const totalShortlist = departmentMetrics.reduce((sum, dept) => sum + dept.candidates.shortlist, 0)
    const totalEmployees = departmentMetrics.reduce((sum, dept) => sum + dept.employees.total, 0)

    return {
      totalCandidates,
      totalCallImmediately,
      totalRemove,
      totalShortlist,
      totalEmployees
    }
  }, [departmentMetrics])

  // Department comparison chart data
  const departmentComparisonData = useMemo(() => {
    return departmentMetrics.map(dept => ({
      name: dept.name,
      candidates: dept.candidates.total,
      employees: dept.employees.total,
      callImmediately: dept.candidates.callImmediately,
      remove: dept.candidates.remove,
      shortlist: dept.candidates.shortlist
    }))
  }, [departmentMetrics])

  // Recommendation distribution across departments
  const recommendationPieData = useMemo(() => {
    const callImmediately = overallStats.totalCallImmediately
    const remove = overallStats.totalRemove
    const shortlist = overallStats.totalShortlist
    return [
      { key: "callImmediately", label: "Call Immediately", value: callImmediately, color: "#10b981" },
      { key: "remove", label: "Remove", value: remove, color: "#ef4444" },
      { key: "shortlist", label: "Shortlist", value: shortlist, color: "#3b82f6" },
    ]
  }, [overallStats])

  // Department candidate distribution
  const departmentCandidateData = useMemo(() => {
    return departmentMetrics.map(dept => ({
      name: dept.name,
      candidates: dept.candidates.total,
      employees: dept.employees.total,
    }))
  }, [departmentMetrics])

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500">Multi-department candidate evaluation overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { fetchData(); fetchDepartmentMetrics(); }} disabled={loading || departmentLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading || departmentLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl shadow-md">
          <AlertTitle>Failed to load data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-600">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departmentLoading ? "..." : overallStats.totalCandidates}</div>
            <p className="text-xs text-neutral-500 mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-600">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{departmentLoading ? "..." : overallStats.totalEmployees}</div>
            <p className="text-xs text-neutral-500 mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-600">Call Immediately</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{departmentLoading ? "..." : overallStats.totalCallImmediately}</div>
            <p className="text-xs text-neutral-500 mt-1">Priority candidates</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-600">Remove</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{departmentLoading ? "..." : overallStats.totalRemove}</div>
            <p className="text-xs text-neutral-500 mt-1">Not suitable</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-600">Shortlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{departmentLoading ? "..." : overallStats.totalShortlist}</div>
            <p className="text-xs text-neutral-500 mt-1">Under review</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departmentMetrics.map((dept) => (
          <Card key={dept.name} className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-500" />
                <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-neutral-500">Candidates</p>
                  <p className="font-semibold">{dept.candidates.total}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Employees</p>
                  <p className="font-semibold">{dept.employees.total}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                  {dept.candidates.callImmediately} Call Immediately
                </Badge>
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                  {dept.candidates.remove} Remove
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Candidate Distribution */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Department Candidate Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentLoading ? (
              <div className="h-[320px] rounded-xl bg-neutral-100 animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  candidates: { label: "Candidates", color: "var(--chart-3)" },
                  employees: { label: "Employees", color: "var(--chart-5)" },
                }}
                className="h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentCandidateData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="candidates" name="Candidates" fill="var(--chart-3)" radius={6} />
                    <Bar dataKey="employees" name="Employees" fill="var(--chart-5)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recommendation Distribution */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Overall Recommendation Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentLoading ? (
              <div className="h-[320px] rounded-xl bg-neutral-100 animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  callImmediately: { label: "Call Immediately", color: "var(--chart-3)" },
                  remove: { label: "Remove", color: "var(--chart-5)" },
                  shortlist: { label: "Shortlist", color: "var(--chart-1)" },
                }}
                className="h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <Legend />
                    <Pie data={recommendationPieData} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} strokeWidth={2}>
                      {recommendationPieData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column info: Recent Events + Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calendar">
                View Calendar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto max-w-[1180px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Event</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[140px]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-32 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!eventsLoading &&
                    events.slice(0, 5).map((event: any) => {
                      const startDate = new Date(event.start_time).toLocaleDateString()
                      const startTime = new Date(event.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.type === "interview"
                                  ? "bg-blue-100 text-blue-800"
                                  : event.type === "pto"
                                    ? "bg-green-100 text-green-800"
                                    : event.type === "holiday"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {event.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-neutral-600">
                            {startDate} {!event.all_day && startTime}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  {!eventsLoading && events.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-neutral-500">
                        No upcoming events.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Multi-Department Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral-700">
            <ul className="space-y-2 list-disc pl-5">
              <li>
                {"Across "}
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">{departmentMetrics.length}</Badge>
                {" departments, you have "}
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{overallStats.totalCallImmediately}</Badge>
                {" candidates to call immediately, "}
                <Badge variant="secondary" className="bg-red-100 text-red-800">{overallStats.totalRemove}</Badge>
                {" to remove, and "}
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">{overallStats.totalShortlist}</Badge>
                {" shortlisted."}
              </li>
              <li>
                {"Total active employees: "}
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">{overallStats.totalEmployees}</Badge>
                {" across all departments."}
              </li>
              <li>
                {"Upcoming events: "}
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">{events.length}</Badge>
                {" scheduled. "}
                {events.filter((e) => e.type === "interview").length > 0 &&
                  `${events.filter((e) => e.type === "interview").length} interviews planned.`}
              </li>
              {outbox.length > 0 && (
                <li>
                  {"Recent notifications: "}
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">{outbox.filter((n) => n.status === "sent").length}</Badge>
                  {" sent, "}
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">{outbox.filter((n) => n.status === "queued").length}</Badge>
                  {" queued."}
                </li>
              )}
              <li>Each department has specific evaluation criteria and scoring metrics.</li>
            </ul>
            <div className="pt-2 flex gap-2">
              <Button asChild size="sm">
                <Link href="/calendar">Open Calendar</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/applicants">View All Candidates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Table */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Recent Candidates by Department</CardTitle>
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
                    </TableRow>
                  ))}
                {!loading &&
                  data.slice(0, 8).map((c) => (
                    <TableRow key={c.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium min-w-[150px] whitespace-nowrap">{c.name}</TableCell>
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
                    </TableRow>
                  ))}
                {!loading && data.length === 0 && !error && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-sm text-neutral-500">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
    </div>
  )
}

function RecommendationBadge({ value }: { value?: string }) {
  const v = (value || "").toLowerCase()

  if (v === "remove") {
    return <Badge variant="destructive">Remove</Badge>
  }

  if (v === "call immediately" || v === "call immediatley") {
    return (
      <Badge className="bg-emerald-100 text-emerald-900" variant="secondary">
        Call Immediately
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
