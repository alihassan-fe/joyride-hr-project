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
import { ExternalLink, RefreshCw, FileText, Info, ArrowRight } from "lucide-react"

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

type WebhookCandidate = {
  id: number
  name: string
  email: string
  phone: string
  cvLink?: string
  dispatch?: number
  operationsManager?: number
  strengths?: string[]
  weaknesses?: string[]
  notes?: string
  recommendation?: string // 'Remove' | 'Consider' | undefined
}

type Broadcast = {
  id: number | string
  title: string
  body?: string
  created_at?: string
  createdAt?: string
  created_by?: string
  createdBy?: string
}

// Change this URL to your actual n8n public webhook
const WEBHOOK_URL = "https://example.com/webhook/candidates"

// Fallback candidate data when webhook doesn't return data
const sampleData: WebhookCandidate[] = [
  {
    id: 183,
    name: "Sergej Miladinović",
    email: "sergejmiladinovic00@gmail.com",
    phone: "387 66 229 390",
    cvLink: "https://drive.google.com/file/d/1AaRDBd6932qT13u_OjMa4GyEZN0imDbK/view?usp=drivesdk",
    dispatch: 2,
    operationsManager: 1,
    strengths: [
      "Good computer skills including Microsoft Office, AutoCAD...",
      "Troubleshooting and technical support experience...",
      "Fluent in English and native Serbian speaker.",
    ],
    weaknesses: ["No direct experience in freight dispatch...", "Lacks specific experience in load assignments..."],
    notes: "Candidate does not have relevant industry experience...",
    recommendation: "Remove",
  },
  {
    id: 184,
    name: "Ana Petrović",
    email: "ana.petrovic@email.com",
    phone: "387 65 123 456",
    cvLink: "https://drive.google.com/file/d/example2",
    dispatch: 4,
    operationsManager: 5,
    strengths: [
      "5+ years experience in logistics",
      "Strong communication skills",
      "Proven track record in operations management",
    ],
    weaknesses: ["Limited experience with specific software tools", "May need training on company procedures"],
    notes: "Strong candidate with relevant experience and good references.",
    recommendation: "Consider",
  },
  {
    id: 185,
    name: "Marko Jovanović",
    email: "marko.jovanovic@email.com",
    phone: "387 64 987 654",
    cvLink: "https://drive.google.com/file/d/example3",
    dispatch: 5,
    operationsManager: 4,
    strengths: ["Excellent dispatch experience", "Strong problem-solving skills", "Great under pressure"],
    weaknesses: ["Limited management experience", "Needs improvement in documentation"],
    notes: "Excellent technical skills, would be great for dispatch role.",
    recommendation: "Consider",
  },
]

// Fallback broadcasts
const sampleBroadcasts: Broadcast[] = [
  {
    id: 1,
    title: "Office closed on Monday (Public Holiday)",
    body: "Enjoy the long weekend!",
    created_at: new Date().toISOString(),
    created_by: "HR",
  },
  {
    id: 2,
    title: "Quarterly Town Hall Friday 3 PM",
    body: "Join via Zoom link in calendar.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: "Ops",
  },
  {
    id: 3,
    title: "Benefits enrollment window opens",
    body: "See email for details.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_by: "HR",
  },
]

export default function DashboardPage() {
  const [data, setData] = useState<WebhookCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogItems, setDialogItems] = useState<string[]>([])

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [broadcastsLoading, setBroadcastsLoading] = useState(false)

  async function fetchData() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(WEBHOOK_URL, { cache: "no-store" })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
      const json = (await res.json()) as WebhookCandidate[] | { data: WebhookCandidate[] }
      const arr = Array.isArray(json) ? json : (json as any).data
      if (!Array.isArray(arr)) throw new Error("Unexpected response shape")
      setData(arr.length > 0 ? arr : sampleData)
    } catch (e: any) {
      setError(e.message || "Failed to fetch candidates")
      setData(sampleData)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBroadcasts() {
    setBroadcastsLoading(true)
    try {
      const res = await fetch("/api/broadcasts", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load broadcasts")
      const json = (await res.json()) as Broadcast[] | { data: Broadcast[] }
      const arr = Array.isArray(json) ? json : (json as any).data
      if (!Array.isArray(arr)) throw new Error("Unexpected broadcasts response shape")
      setBroadcasts(arr.length > 0 ? arr : sampleBroadcasts)
    } catch {
      setBroadcasts(sampleBroadcasts)
    } finally {
      setBroadcastsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchBroadcasts()
  }, [])

  function openListDialog(title: string, items: string[] = []) {
    setDialogTitle(title)
    setDialogItems(items)
    setDialogOpen(true)
  }

  // Score comparison for existing ECharts line
  const lineChartOption = useMemo(() => {
    const names = data.map((c) => c.name)
    const dispatchScores = data.map((c) => Number(c.dispatch ?? 0))
    const opsScores = data.map((c) => Number(c.operationsManager ?? 0))
    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Dispatch", "Ops Manager"] },
      grid: { left: 40, right: 20, bottom: 40, top: 40, containLabel: true },
      xAxis: { type: "category", data: names, axisLabel: { interval: 0, rotate: names.length > 6 ? 30 : 0 } },
      yAxis: { type: "value", min: 0 },
      series: [
        {
          name: "Dispatch",
          type: "line",
          data: dispatchScores,
          itemStyle: { color: "#f59e0b" },
          lineStyle: { color: "#f59e0b" },
          symbol: "circle",
          symbolSize: 6,
        },
        {
          name: "Ops Manager",
          type: "line",
          data: opsScores,
          itemStyle: { color: "#10b981" },
          lineStyle: { color: "#10b981" },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    }
  }, [data])

  // Stats
  const stats = useMemo(() => {
    const candidates = data
    return {
      total: candidates.length,
      consider: candidates.filter((c) => c.recommendation?.toLowerCase() === "consider").length,
      remove: candidates.filter((c) => c.recommendation?.toLowerCase() === "remove").length,
      avgDispatch:
        candidates.length > 0
          ? (candidates.reduce((sum, c) => sum + (c.dispatch || 0), 0) / candidates.length).toFixed(1)
          : "0",
      avgOpsManager:
        candidates.length > 0
          ? (candidates.reduce((sum, c) => sum + (c.operationsManager || 0), 0) / candidates.length).toFixed(1)
          : "0",
    }
  }, [data])

  // New charts data
  const groupedBarData = useMemo(
    () =>
      data.map((c) => ({
        name: c.name,
        dispatch: Number(c.dispatch ?? 0),
        ops: Number(c.operationsManager ?? 0),
      })),
    [data],
  )

  const recommendationPieData = useMemo(() => {
    const consider = stats.consider
    const remove = stats.remove
    return [
      { key: "consider", label: "Consider", value: consider },
      { key: "remove", label: "Remove", value: remove },
    ]
  }, [stats.consider, stats.remove])

  return (
    <div className="space-y-6">
      {/* Quick links cards */}
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Applicants</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Manage candidates and reviews.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/applicants">Open</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Directory and broadcasts.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/employees">Open</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">PTO, holidays, interviews.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/calendar">Open</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500">Visualize candidate evaluation data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? "Refreshing..." : "Refresh"}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Consider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : stats.consider}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Remove</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{loading ? "..." : stats.remove}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Avg Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{loading ? "..." : stats.avgDispatch}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Avg Ops Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "..." : stats.avgOpsManager}</div>
          </CardContent>
        </Card>
      </div>

      {/* New charts row (2 charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped Bar Chart: Dispatch vs Ops Manager */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Scores by Candidate (Bar)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[320px] rounded-xl bg-neutral-100 animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  dispatch: { label: "Dispatch", color: "hsl(var(--chart-4))" },
                  ops: { label: "Ops Manager", color: "hsl(var(--chart-2))" },
                }}
                className="h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedBarData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={groupedBarData.length > 6 ? -20 : 0}
                      textAnchor={groupedBarData.length > 6 ? "end" : "middle"}
                    />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="dispatch" name="Dispatch" fill="var(--color-dispatch)" radius={6} />
                    <Bar dataKey="ops" name="Ops Manager" fill="var(--color-ops)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recommendation Distribution Donut */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Recommendation Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[320px] rounded-xl bg-neutral-100 animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  consider: { label: "Consider", color: "hsl(var(--chart-3))" },
                  remove: { label: "Remove", color: "hsl(var(--chart-5))" },
                }}
                className="h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                    <Legend />
                    <Pie
                      data={recommendationPieData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={70}
                      outerRadius={110}
                      strokeWidth={2}
                    >
                      {recommendationPieData.map((entry) => (
                        <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Existing Score Comparison Line Chart (ECharts) */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Score Comparison (Line)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[360px] rounded-xl bg-neutral-100 animate-pulse" />
          ) : (
            <div className="w-full">
              <ReactECharts option={lineChartOption} style={{ height: 360 }} notMerge={true} lazyUpdate={true} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-column info: Recent Broadcasts + Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Small table: Recent Broadcasts */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Broadcasts</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/broadcasts">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Title</TableHead>
                    <TableHead className="min-w-[140px]">Created</TableHead>
                    <TableHead className="min-w-[120px]">By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcastsLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 w-48 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!broadcastsLoading &&
                    broadcasts.slice(0, 5).map((b) => {
                      const created =
                        b.createdAt || b.created_at
                          ? new Date((b.createdAt as string) || (b.created_at as string)).toLocaleString()
                          : ""
                      return (
                        <TableRow key={String(b.id)}>
                          <TableCell className="font-medium">{b.title}</TableCell>
                          <TableCell className="text-neutral-600">{created}</TableCell>
                          <TableCell className="text-neutral-600">{b.createdBy || b.created_by || "—"}</TableCell>
                        </TableRow>
                      )
                    })}
                  {!broadcastsLoading && broadcasts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-neutral-500">
                        No broadcasts yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Useful information card */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral-700">
            <ul className="space-y-2 list-disc pl-5">
              <li>
                {"You have "}
                <strong>{stats.consider}</strong>
                {" candidates marked as "}
                <strong>Consider</strong>
                {" and "}
                <strong>{stats.remove}</strong>
                {" marked as "}
                <strong>Remove</strong>
                {"."}
              </li>
              <li>
                {"Average scores — Dispatch: "}
                <strong>{stats.avgDispatch}</strong>
                {", Ops Manager: "}
                <strong>{stats.avgOpsManager}</strong>.
              </li>
              <li>Use Calendar to plan interviews and track PTO; drag on the calendar to create events quickly.</li>
              <li>Use Broadcasts to send announcements to the team.</li>
              <li>Tip: Click “Refresh” above to pull the latest candidate scores from the webhook source.</li>
            </ul>
            <div className="pt-2">
              <Button asChild>
                <Link href="/dashboard/calendar">Open Calendar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Table (existing, kept) */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="overflow-x-auto relative">
              <Table className="w-[1200px] w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Name</TableHead>
                    <TableHead className="min-w-[200px] whitespace-nowrap">Email</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Phone</TableHead>
                    <TableHead className="min-w-[80px] whitespace-nowrap">Dispatch</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Ops Manager</TableHead>
                    <TableHead className="min-w-[80px] whitespace-nowrap">CV</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Strengths</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Weaknesses</TableHead>
                    <TableHead className="min-w-[200px]">
                      <span className="text-sm font-medium text-neutral-600">Notes</span>
                    </TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">
                      <span className="text-sm font-medium text-neutral-600">Recommendation</span>
                    </TableHead>
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
                        <TableCell className="min-w-[120px] whitespace-nowrap">
                          <div className="h-4 w-full max-w-[100px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading &&
                    data.map((c) => (
                      <TableRow key={c.id} className="hover:bg-neutral-50">
                        <TableCell className="font-medium min-w-[150px] whitespace-nowrap">{c.name}</TableCell>
                        <TableCell className="text-neutral-600 min-w-[200px] whitespace-nowrap">{c.email}</TableCell>
                        <TableCell className="text-neutral-600 min-w-[120px] whitespace-nowrap">{c.phone}</TableCell>
                        <TableCell className="min-w-[80px] whitespace-nowrap">
                          {typeof c.dispatch === "number" ? c.dispatch : "-"}
                        </TableCell>
                        <TableCell className="min-w-[100px] whitespace-nowrap">
                          {typeof c.operationsManager === "number" ? c.operationsManager : "-"}
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
                              {"Open"}
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
                          <RecommendationBadge value={c.recommendation} />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loading && data.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-sm text-neutral-500">
                        No candidates found from the webhook.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
  if (v === "consider") {
    return (
      <Badge className="bg-emerald-100 text-emerald-900" variant="secondary">
        Consider
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-neutral-100 text-neutral-800">
      —
    </Badge>
  )
}