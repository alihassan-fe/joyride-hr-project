"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ExternalLink, RefreshCw, FileText, Info } from "lucide-react"
import Link from "next/link"

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
  recommendation?: string // e.g., 'Remove' | 'Consider'
}

// Change this URL to your actual n8n public webhook
const WEBHOOK_URL = "https://example.com/webhook/candidates"

// Fallback data when webhook doesn't return data
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

export default function DashboardPage() {
  const [data, setData] = useState<WebhookCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogItems, setDialogItems] = useState<string[]>([])

  async function fetchData() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(WEBHOOK_URL, { cache: "no-store" })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
      const json = (await res.json()) as WebhookCandidate[] | { data: WebhookCandidate[] }
      const arr = Array.isArray(json) ? json : (json as any).data
      if (!Array.isArray(arr)) throw new Error("Unexpected response shape")

      // Use webhook data if available, otherwise use fallback data
      if (arr.length > 0) {
        setData(arr)
      } else {
        setData(sampleData)
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch candidates")
      // Use fallback data when webhook fails
      setData(sampleData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function openListDialog(title: string, items: string[] = []) {
    setDialogTitle(title)
    setDialogItems(items)
    setDialogOpen(true)
  }

  const chartOption = useMemo(() => {
    const names = data.map((c) => c.name)
    const dispatchScores = data.map((c) => Number(c.dispatch ?? 0))
    const opsScores = data.map((c) => Number(c.operationsManager ?? 0))
    return {
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Dispatch", "Ops Manager"],
      },
      grid: { left: 40, right: 20, bottom: 40, top: 40, containLabel: true },
      xAxis: { type: "category", data: names, axisLabel: { interval: 0, rotate: names.length > 6 ? 30 : 0 } },
      yAxis: { type: "value", min: 0 },
      series: [
        {
          name: "Dispatch",
          type: "line",
          data: dispatchScores,
          itemStyle: { color: "#f59e0b" }, // amber-500
          lineStyle: { color: "#f59e0b" },
          symbol: "circle",
          symbolSize: 6,
        },
        {
          name: "Ops Manager",
          type: "line",
          data: opsScores,
          itemStyle: { color: "#10b981" }, // emerald-500
          lineStyle: { color: "#10b981" },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    }
  }, [data])

  // Calculate stats
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

  return (
    <div className="space-y-6">

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

      {/* Score Comparison Line Chart */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[360px] rounded-xl bg-neutral-100 animate-pulse" />
          ) : (
            <div className="w-full">
              <ReactECharts option={chartOption} style={{ height: 360 }} notMerge={true} lazyUpdate={true} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Table */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Candidates</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="border rounded-md overflow-x-auto w-full max-w-[1190px]">
              <Table className="w-full">
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
        </CardContent>
      </Card>

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
