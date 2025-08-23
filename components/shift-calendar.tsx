"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ShiftType, EmployeeShift, Employee } from "@/lib/types"

type ViewMode = "daily" | "weekly" | "monthly"

interface ShiftCalendarProps {
  employees: Employee[]
}

export function ShiftCalendar({ employees }: ShiftCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<EmployeeShift[]>([])
  console.log("🚀 ~ ShiftCalendar ~ shifts:", shifts)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [formData, setFormData] = useState({
    employee_id: "",
    shift_type_id: "",
    notes: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchShiftTypes()
    fetchShifts()
  }, [currentDate, viewMode])

  const fetchShiftTypes = async () => {
    try {
      const response = await fetch("/api/shifts")
      if (response.ok) {
        const data = await response.json()
        setShiftTypes(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching shift types:", error)
    }
  }

  const fetchShifts = async () => {
    try {
      const startDate = getStartDate()
      const endDate = getEndDate()
      
      const response = await fetch(`/api/shifts/assignments?start_date=${startDate}&end_date=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setShifts(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching shifts:", error)
      setShifts([]) // Ensure shifts is always an array
    }
  }

  const getStartDate = () => {
    const date = new Date(currentDate)
    if (viewMode === "daily") {
      return date.toISOString().slice(0, 10)
    } else if (viewMode === "weekly") {
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      date.setDate(diff)
      return date.toISOString().slice(0, 10)
    } else {
      date.setDate(1)
      return date.toISOString().slice(0, 10)
    }
  }

  const getEndDate = () => {
    const date = new Date(currentDate)
    if (viewMode === "daily") {
      return date.toISOString().slice(0, 10)
    } else if (viewMode === "weekly") {
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? 0 : 7)
      date.setDate(diff)
      return date.toISOString().slice(0, 10)
    } else {
      date.setMonth(date.getMonth() + 1)
      date.setDate(0)
      return date.toISOString().slice(0, 10)
    }
  }

  const handleAssignShift = async () => {
    if (!formData.employee_id || !formData.shift_type_id || !selectedDate) {
      toast({
        title: "Missing fields",
        description: "Please select employee, shift type, and date",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/shifts/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: formData.employee_id,
          shift_type_id: parseInt(formData.shift_type_id),
          shift_date: selectedDate,
          notes: formData.notes.trim() || null,
          assigned_by: null // Set to null for now, can be updated later with actual user ID
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Shift assigned successfully",
        })
        setFormData({
          employee_id: "",
          shift_type_id: "",
          notes: ""
        })
        setIsAssignDialogOpen(false)
        await fetchShifts()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign shift")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign shift",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getShiftsForDate = (date: string) => {
    if (!Array.isArray(shifts)) return [];
  
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.shift_date).toISOString().split("T")[0];
      return shiftDate === date;
    });
  };  

  const getShiftTypeById = (id: number) => {
    return shiftTypes.find(type => type.id === id)
  }

  const getEmployeeById = (id: string) => {
    return employees.find(emp => emp.id === id)
  }

  const renderDailyView = () => {
    const date = currentDate.toISOString().slice(0, 10)
    console.log("🚀 ~ renderDailyView ~ date:", date)
    const dayShifts = getShiftsForDate(date)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shiftTypes.map(shiftType => (
            <Card key={shiftType.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: shiftType.color }}
                />
                <h3 className="font-medium">{shiftType.name}</h3>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {shiftType.start_time} - {shiftType.end_time}
              </div>
              <div className="space-y-2">
                {dayShifts
                  .filter(shift => shift.shift_type_id === shiftType.id)
                  .map(shift => {
                    const employee = getEmployeeById(shift.employee_id)
                    return (
                      <div key={shift.id} className="p-2 bg-muted rounded text-sm">
                        {employee?.name || "Unknown Employee"}
                      </div>
                    )
                  })}
                {dayShifts.filter(shift => shift.shift_type_id === shiftType.id).length === 0 && (
                  <div className="text-sm text-muted-foreground italic">No assignments</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderWeeklyView = () => {
    const startDate = new Date(getStartDate())
    const days: string[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date.toISOString().slice(0, 10))
    }

    return (
      <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Grid: (1 col for Time + N cols for days) */}
        <div className={`grid grid-cols-${days.length + 1} border`}>
          
          {/* Header row */}
          <div className="p-2 font-medium text-sm border-r">Time</div>
          {days.map(day => (
            <div
              key={day}
              className="p-2 font-medium text-sm text-center border-r"
            >
              {new Date(day).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          ))}
    
          {/* Shift rows */}
          {shiftTypes.map(shiftType => (
            <>
              {/* Left column: Shift name */}
              <div
                key={shiftType.id}
                className="p-2 text-sm font-medium border-t border-r"
              >
                {shiftType.name}
              </div>
    
              {/* Day columns */}
              {days.map(day => {
                const dayShifts = getShiftsForDate(day).filter(
                  shift => shift.shift_type_id === shiftType.id
                );
    
                return (
                  <div
                    key={`${shiftType.id}-${day}`}
                    className="p-2 border-t border-r min-h-[60px] flex flex-col"
                  >
                    {dayShifts.map(shift => {
                      const employee = getEmployeeById(shift.employee_id);
                      return (
                        <div
                          key={shift.id}
                          className="text-xs p-1 bg-muted rounded mb-1 w-full"
                        >
                          {employee?.name || "Unknown"}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
    
    )
  }

  const renderMonthlyView = () => {
    const startDate = new Date(getStartDate())
    const endDate = new Date(getEndDate())
    const days: string[] = []
    
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(current.toISOString().slice(0, 10))
      current.setDate(current.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dayShifts = getShiftsForDate(day)
          const isCurrentMonth = new Date(day).getMonth() === currentDate.getMonth()
          
          return (
            <div 
              key={day} 
              className={`p-2 min-h-[80px] border ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}`}
            >
              <div className="text-sm font-medium mb-1">
                {new Date(day).getDate()}
              </div>
              <div className="space-y-1">
                {dayShifts.map(shift => {
                  const shiftType = getShiftTypeById(shift.shift_type_id)
                  const employee = getEmployeeById(shift.employee_id)
                  return (
                    <div 
                      key={shift.id} 
                      className="text-xs p-1 rounded text-white"
                      style={{ backgroundColor: shiftType?.color || '#6B7280' }}
                    >
                      {employee?.name?.split(' ')[0] || "Unknown"}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shift Calendar
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Shift</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shift_type">Shift Type</Label>
                    <Select value={formData.shift_type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, shift_type_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift type" />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftTypes.map(shiftType => (
                          <SelectItem key={shiftType.id} value={shiftType.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: shiftType.color }}
                              />
                              {shiftType.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shift_date">Date</Label>
                    <Input
                      id="shift_date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignShift} disabled={isLoading}>
                      {isLoading ? "Assigning..." : "Assign Shift"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === "daily") {
                newDate.setDate(newDate.getDate() - 1)
              } else if (viewMode === "weekly") {
                newDate.setDate(newDate.getDate() - 7)
              } else {
                newDate.setMonth(newDate.getMonth() - 1)
              }
              setCurrentDate(newDate)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-medium">
              {viewMode === "daily" && currentDate.toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
              {viewMode === "weekly" && `Week of ${getStartDate()}`}
              {viewMode === "monthly" && currentDate.toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "long" 
              })}
            </h3>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === "daily") {
                newDate.setDate(newDate.getDate() + 1)
              } else if (viewMode === "weekly") {
                newDate.setDate(newDate.getDate() + 7)
              } else {
                newDate.setMonth(newDate.getMonth() + 1)
              }
              setCurrentDate(newDate)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar View */}
        {viewMode === "daily" && renderDailyView()}
        {viewMode === "weekly" && renderWeeklyView()}
        {viewMode === "monthly" && renderMonthlyView()}
      </CardContent>
    </Card>
  )
}
