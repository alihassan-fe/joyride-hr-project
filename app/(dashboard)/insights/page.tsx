"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, RefreshCw, FileText, Info } from 'lucide-react'

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

export default function InsightsPage() {
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
      setData(arr)
    } catch (e: any) {
      setError(e.message || "Failed to fetch candidates")
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
          type: "bar",
          data: dispatchScores,
          itemStyle: { color: "#f59e0b" }, // amber-500
          barMaxWidth: 28,
        },
        {
          name: "Ops Manager",
          type: "bar",
          data: opsScores,
          itemStyle: { color: "#10b981" }, // emerald-500
          barMaxWidth: 28,
        },
      ],
    }
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-neutral-500">Visualize candidate evaluation data from your n8n webhook</p>
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

      {/* Score Comparison Bar Chart */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[360px] rounded-xl bg-neutral-100 animate-pulse" />
          ) : (
            <div className="w-full">
              <ReactECharts
                option={chartOption}
                style={{ height: 360, width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
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
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Dispatch</TableHead>
                  <TableHead>Ops Manager</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Strengths</TableHead>
                  <TableHead>Weaknesses</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-full max-w-[140px] rounded bg-neutral-100 animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!loading &&
                  data.map((c) => (
                    <TableRow key={c.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-neutral-600">{c.email}</TableCell>
                      <TableCell className="text-neutral-600">{c.phone}</TableCell>
                      <TableCell>{typeof c.dispatch === "number" ? c.dispatch : "-"}</TableCell>
                      <TableCell>{typeof c.operationsManager === "number" ? c.operationsManager : "-"}</TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openListDialog(`Strengths — ${c.name}`, c.strengths || [])}
                          disabled={!c.strengths || c.strengths.length === 0}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openListDialog(`Weaknesses — ${c.name}`, c.weaknesses || [])}
                          disabled={!c.weaknesses || c.weaknesses.length === 0}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        {c.notes ? (
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
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
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
    return <Badge className="bg-emerald-100 text-emerald-900" variant="secondary">Consider</Badge>
  }
  return <Badge variant="secondary" className="bg-neutral-100 text-neutral-800">—</Badge>
}
