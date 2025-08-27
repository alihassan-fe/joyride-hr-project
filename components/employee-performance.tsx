"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, Plus, FileText, Calendar, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EmployeePerformance, EmployeePerformanceDocument } from "@/lib/types"

interface EmployeePerformanceProps {
  employeeId: string
  currentScore?: number
}

export function EmployeePerformance({ employeeId, currentScore }: EmployeePerformanceProps) {
  const [performanceRecords, setPerformanceRecords] = useState<EmployeePerformance[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    score: "",
    performance_date: new Date().toISOString().slice(0, 10),
    notes: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPerformanceRecords()
  }, [employeeId])

  const fetchPerformanceRecords = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/performance`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceRecords(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching performance records:", error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.score || !formData.performance_date) {
      toast({
        title: "Missing fields",
        description: "Score and date are required",
        variant: "destructive",
      })
      return
    }
    const onPerformanceChange = async () => {
      // do something (maybe POST update to API)
      // then refresh
      window.location.reload();
    };

    const score = parseFloat(formData.score)
    if (isNaN(score) || score < 0 || score > 10) {
      toast({
        title: "Invalid score",
        description: "Score must be between 0 and 10",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          performance_date: formData.performance_date,
          notes: formData.notes.trim() || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Performance record added successfully",
        })
        setFormData({
          score: "",
          performance_date: new Date().toISOString().slice(0, 10),
          notes: ""
        })
        setIsAddDialogOpen(false)
        await fetchPerformanceRecords()
        onPerformanceChange()
      } else {
        throw new Error("Failed to add performance record")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add performance record",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Tracking
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Performance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Performance Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="score">Score (0-10)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.score}
                    onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                    placeholder="8.5"
                  />
                </div>
                <div>
                  <Label htmlFor="performance_date">Performance Date</Label>
                  <Input
                    id="performance_date"
                    type="date"
                    value={formData.performance_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, performance_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Performance comments..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Record"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Score Display */}
        {currentScore !== undefined && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Performance Score</p>
              <Badge className={`text-lg font-semibold ${getScoreColor(currentScore)}`}>
                {currentScore}/10
              </Badge>
            </div>
          </div>
        )}

        {/* Performance History */}
        <div>
          <h4 className="text-sm font-medium mb-3">Performance History</h4>
          <ScrollArea className="h-[400px]">
            {performanceRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No performance records yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(record.performance_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(record.score)}>
                          {record.score}/10
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {record.notes || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.documents && record.documents.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {record.documents.length} file{record.documents.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
