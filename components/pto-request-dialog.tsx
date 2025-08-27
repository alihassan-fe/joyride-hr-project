"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, Info, Search, X } from "lucide-react"

interface PTORequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: any[]
  onSuccess: () => void
}

interface Employee {
  id: string
  name: string
  email: string
  department?: string
  pto_balance: number
  manager_id?: string
}

export function PTORequestDialog({ open, onOpenChange, employees, onSuccess }: PTORequestDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    is_full_day: true,
    start_time: "09:00",
    end_time: "17:00",
    reason: "",
    manager_id: ""
  })
  const [calculatedDays, setCalculatedDays] = useState(0)
  const [ptoBalanceAfter, setPtoBalanceAfter] = useState(0)
  const [managers, setManagers] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const { toast } = useToast()

  // Memoize the managers calculation to prevent infinite re-renders
  const updateManagers = useCallback(() => {
    if (open && employees.length > 0) {
      const potentialManagers = employees.filter(emp => 
        emp.role && ['HR Manager', 'Department Manager', 'Team Lead', 'Manager'].includes(emp.role)
      )
      setManagers(potentialManagers)
    }
  }, [open, employees])

  useEffect(() => {
    updateManagers()
  }, [updateManagers])

  // Memoize the PTO calculation to prevent infinite re-renders
  const calculatePTODays = useCallback(() => {
    if (!selectedEmployee || !formData.start_date || !formData.end_date) return

    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (startDate > endDate) {
      setCalculatedDays(0)
      setPtoBalanceAfter(selectedEmployee.pto_balance)
      return
    }

    let days = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      // Only count weekdays (Monday = 1, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (formData.is_full_day) {
          days += 1
        } else {
          // For partial days, calculate based on hours
          const startTime = new Date(`2000-01-01T${formData.start_time}`)
          const endTime = new Date(`2000-01-01T${formData.end_time}`)
          const hoursDiff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
          days += hoursDiff / 8 // Assuming 8-hour workday
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setCalculatedDays(Math.round(days * 10) / 10) // Round to 1 decimal place
    setPtoBalanceAfter(selectedEmployee.pto_balance - days)
  }, [selectedEmployee, formData.start_date, formData.end_date, formData.is_full_day, formData.start_time, formData.end_time])

  useEffect(() => {
    calculatePTODays()
  }, [calculatePTODays])

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSearchQuery("")
    setShowSearchResults(false)
    // Auto-select manager if employee has one
    if (employee.manager_id) {
      const manager = managers.find(m => m.id === employee.manager_id)
      if (manager) {
        setFormData(prev => ({ ...prev, manager_id: manager.id }))
      }
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length >= 2) {
      const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(query.toLowerCase()) ||
        emp.email.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered.slice(0, 10))
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedEmployee || !formData.start_date || !formData.end_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (calculatedDays > selectedEmployee.pto_balance) {
      toast({
        title: "Insufficient PTO Balance",
        description: `Employee only has ${selectedEmployee.pto_balance} days available`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/calendar/pto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_full_day: formData.is_full_day,
          start_time: formData.is_full_day ? null : formData.start_time,
          end_time: formData.is_full_day ? null : formData.end_time,
          reason: formData.reason,
          manager_id: formData.manager_id
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "PTO request submitted successfully",
        })
        onSuccess()
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to submit PTO request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit PTO request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedEmployee(null)
    setFormData({
      start_date: "",
      end_date: "",
      is_full_day: true,
      start_time: "09:00",
      end_time: "17:00",
      reason: "",
      manager_id: ""
    })
    setCalculatedDays(0)
    setPtoBalanceAfter(0)
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  const isFormValid = selectedEmployee && formData.start_date && formData.end_date && calculatedDays > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Request PTO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Employee *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                        setShowSearchResults(true)
                      }
                    }}
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((emp) => (
                        <div
                          key={emp.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleEmployeeSelect(emp)}
                        >
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-muted-foreground">{emp.email}</div>
                          {emp.department && (
                            <div className="text-xs text-muted-foreground">{emp.department}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Current PTO Balance</p>
                    <p className="text-2xl font-bold text-green-600">{selectedEmployee.pto_balance} days</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.department || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PTO Details */}
          <Card>
            <CardHeader>
              <CardTitle>PTO Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="full_day"
                  checked={formData.is_full_day}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_full_day: checked as boolean }))}
                />
                <Label htmlFor="full_day">Full Day</Label>
              </div>

              {!formData.is_full_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason for the PTO request..."
                  rows={3}
                />
              </div>

              {/* Manager Selection */}
              <div>
                <Label htmlFor="manager">Approving Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role || 'Manager'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* PTO Calculation Summary */}
          {selectedEmployee && calculatedDays > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>PTO Calculation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Days Requested</p>
                    <p className="text-2xl font-bold text-blue-600">{calculatedDays}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold text-green-600">{selectedEmployee.pto_balance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Balance After</p>
                    <p className={`text-2xl font-bold ${ptoBalanceAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ptoBalanceAfter.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                {ptoBalanceAfter < 0 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This request will exceed the employee's PTO balance by {Math.abs(ptoBalanceAfter).toFixed(1)} days.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
