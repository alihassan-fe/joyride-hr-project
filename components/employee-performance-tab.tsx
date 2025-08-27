"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Star, TrendingUp, TrendingDown, Target, BarChart3, Plus,
  Calendar, User, Download, Eye, AlertTriangle, CheckCircle
} from "lucide-react"
import { Employee, EmployeeKPI } from "@/lib/types"

interface EmployeePerformanceTabProps {
  employee: Employee
  kpis: EmployeeKPI[]
}

export default function EmployeePerformanceTab({
  employee,
  kpis
}: EmployeePerformanceTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800"
    if (score >= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const [showAddKPIDialog, setShowAddKPIDialog] = useState(false)
  const [showAddScoreDialog, setShowAddScoreDialog] = useState(false)
  const [selectedKPI, setSelectedKPI] = useState<EmployeeKPI | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAddKPI = async (formData: any) => {
    if (!employee.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}/kpis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData
        }),
      })

      if (response.ok) {
        toast({
          title: "KPI Added",
          description: "New KPI has been added successfully.",
        })
        setShowAddKPIDialog(false)
        // Refresh the page to update KPIs
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add KPI")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add KPI",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddScore = async (formData: any) => {
    if (!selectedKPI) return

    setLoading(true)
    try {
      const response = await fetch("/api/employees/kpi-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpi_id: selectedKPI.id,
          employee_id: employee.id,
          ...formData
        }),
      })

      if (response.ok) {
        toast({
          title: "Score Added",
          description: "New performance score has been added successfully.",
        })
        setShowAddScoreDialog(false)
        setSelectedKPI(null)
        // Refresh the page to update scores
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add score")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add score",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getKPITrend = (kpi: EmployeeKPI) => {
    if (!kpi.scores || kpi.scores.length < 2) return "stable"
    
    const recentScores = kpi.scores
      .sort((a, b) => new Date(b.score_date).getTime() - new Date(a.score_date).getTime())
      .slice(0, 2)
    
    const latest = recentScores[0].score
    const previous = recentScores[1].score
    
    if (latest > previous) return "up"
    if (latest < previous) return "down"
    return "stable"
  }

  const getKPITrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return "text-green-600"
      case 'down': return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getKPITrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Performance</p>
                <p className="text-lg font-semibold">
                  {employee.current_performance_score ? `${employee.current_performance_score}/10` : 'Not rated'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active KPIs</p>
                <p className="text-lg font-semibold">{kpis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Evaluations</p>
                <p className="text-lg font-semibold">
                  {kpis.reduce((total, kpi) => total + (kpi.scores?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Key Performance Indicators
            </CardTitle>
            <Button onClick={() => setShowAddKPIDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add KPI
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {kpis.length > 0 ? (
            <div className="space-y-4">
              {kpis.map((kpi) => {
                const trend = getKPITrend(kpi)
                const latestScore = kpi.scores?.[0]?.score || kpi.current_value || 0
                
                return (
                  <div key={kpi.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{kpi.kpi_name}</h4>
                        {kpi.kpi_description && (
                          <p className="text-sm text-muted-foreground">{kpi.kpi_description}</p>
                        )}
                        {kpi.is_department_default && (
                          <Badge variant="outline" className="mt-1">
                            Department Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${getKPITrendColor(trend)}`}>
                          {getKPITrendIcon(trend)}
                          <span className="text-sm font-medium">
                            {latestScore}{kpi.unit ? ` ${kpi.unit}` : ''}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedKPI(kpi)
                            setShowAddScoreDialog(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Score
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {kpi.target_value && (
                        <div>
                          <p className="font-medium">Target</p>
                          <p className="text-muted-foreground">
                            {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ''}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">Current Value</p>
                        <p className="text-muted-foreground">
                          {kpi.current_value || latestScore}{kpi.unit ? ` ${kpi.unit}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Evaluations</p>
                        <p className="text-muted-foreground">{kpi.scores?.length || 0}</p>
                      </div>
                    </div>

                    {/* Recent Scores */}
                    {kpi.scores && kpi.scores.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-sm font-medium mb-2">Recent Scores</h5>
                        <div className="space-y-2">
                          {kpi.scores.slice(0, 3).map((score) => (
                            <div key={score.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge className={getScoreColor(score.score)}>
                                  {score.score}/10
                                </Badge>
                                <span className="text-muted-foreground">
                                  {formatDate(score.score_date)}
                                </span>
                              </div>
                              {score.comment && (
                                <span className="text-muted-foreground text-xs">
                                  {score.comment.substring(0, 50)}...
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No KPIs defined yet</p>
              <Button 
                onClick={() => setShowAddKPIDialog(true)} 
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First KPI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add KPI Dialog */}
      <AddKPIDialog
        open={showAddKPIDialog}
        onOpenChange={setShowAddKPIDialog}
        onSubmit={handleAddKPI}
        loading={loading}
      />

      {/* Add Score Dialog */}
      <AddScoreDialog
        open={showAddScoreDialog}
        onOpenChange={setShowAddScoreDialog}
        kpi={selectedKPI}
        onSubmit={handleAddScore}
        loading={loading}
        getScoreColor={getScoreColor}
      />
    </div>
  )
}

// Add KPI Dialog Component
interface AddKPIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: any) => void
  loading: boolean
}

function AddKPIDialog({ open, onOpenChange, onSubmit, loading }: AddKPIDialogProps) {
  const [formData, setFormData] = useState({
    kpi_name: "",
    kpi_description: "",
    target_value: "",
    unit: "",
    is_department_default: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      target_value: formData.target_value ? parseFloat(formData.target_value) : null
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Add New KPI
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kpi_name">KPI Name *</Label>
            <Input
              id="kpi_name"
              value={formData.kpi_name}
              onChange={(e) => setFormData(prev => ({ ...prev, kpi_name: e.target.value }))}
              placeholder="e.g., Customer Satisfaction Score"
              required
            />
          </div>

          <div>
            <Label htmlFor="kpi_description">Description</Label>
            <Textarea
              id="kpi_description"
              value={formData.kpi_description}
              onChange={(e) => setFormData(prev => ({ ...prev, kpi_description: e.target.value }))}
              placeholder="Describe what this KPI measures..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_value">Target Value</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="e.g., 8.5"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., %, score, hours"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add KPI"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add Score Dialog Component
interface AddScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kpi: EmployeeKPI | null
  onSubmit: (formData: any) => void
  loading: boolean
  getScoreColor: (score: number) => string
}

function AddScoreDialog({ open, onOpenChange, kpi, onSubmit, loading, getScoreColor }: AddScoreDialogProps) {
  const [formData, setFormData] = useState({
    score: "",
    score_date: "",
    comment: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      score: parseFloat(formData.score)
    })
  }

  if (!kpi) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Add Performance Score
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">{kpi.kpi_name}</h4>
            {kpi.kpi_description && (
              <p className="text-sm text-muted-foreground">{kpi.kpi_description}</p>
            )}
            {kpi.target_value && (
              <p className="text-sm text-muted-foreground">
                Target: {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="score">Score (0-10) *</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.score}
                onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                placeholder="e.g., 8.5"
                required
              />
              {formData.score && (
                <Badge className={`mt-2 ${getScoreColor(parseFloat(formData.score))}`}>
                  {parseFloat(formData.score) >= 8 ? "Excellent" : 
                   parseFloat(formData.score) >= 6 ? "Good" : 
                   parseFloat(formData.score) >= 4 ? "Fair" : "Needs Improvement"}
                </Badge>
              )}
            </div>
            <div>
              <Label htmlFor="score_date">Date *</Label>
              <Input
                id="score_date"
                type="date"
                value={formData.score_date}
                onChange={(e) => setFormData(prev => ({ ...prev, score_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Comment *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Provide detailed feedback and observations..."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Score"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
