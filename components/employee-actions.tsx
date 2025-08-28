"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  MoreHorizontal, Mail, Phone, Archive, Trash2, Calendar, 
  Video, AlertTriangle, CheckCircle, Clock
} from "lucide-react"
import { Employee } from "@/lib/types"

interface EmployeeActionsProps {
  employee: Employee
}

export default function EmployeeActions({ employee }: EmployeeActionsProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleEmail = () => {
    window.open(`mailto:${employee.email}`, '_blank')
  }

  const handleCall = () => {
    if (employee.phone) {
      window.open(`tel:${employee.phone}`, '_blank')
    } else {
      toast({
        title: "No Phone Number",
        description: "This employee doesn't have a phone number on file.",
        variant: "destructive",
      })
    }
  }

  const handleArchive = async () => {
    if (!employee.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employment_status: "Archived",
          archived_at: new Date().toISOString()
        }),
      })

      if (response.ok) {
        toast({
          title: "Employee Archived",
          description: `${employee.name} has been archived successfully.`,
        })
        setShowArchiveDialog(false)
        // Refresh the page to update the status
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to archive employee")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive employee",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!employee.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employment_status: "Active"
        }),
      })

      if (response.ok) {
        toast({
          title: "Employee Reactivated",
          description: `${employee.name} has been reactivated successfully.`,
        })
        // Refresh the page to update the status
        window.location.reload()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to reactivate employee")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate employee",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!employee.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Employee Removed",
          description: `${employee.name} has been removed from the system.`,
        })
        setShowRemoveDialog(false)
        // Redirect to employees list
        window.location.href = "/employees"
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove employee")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove employee",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleMeeting = async (formData: any) => {
    if (!employee.id) return

    setLoading(true)
    try {
      const response = await fetch("/api/employees/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee.id,
          ...formData
        }),
      })

      if (response.ok) {
        toast({
          title: "Meeting Scheduled",
          description: `HR meeting has been scheduled for ${employee.name}.`,
        })
        setShowMeetingDialog(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to schedule meeting")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isArchived = employee.employment_status === "inactive"

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Quick Action Buttons */}
        <Button variant="outline" size="sm" onClick={handleEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleCall}>
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>

        {/* Dropdown Menu for Additional Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setShowMeetingDialog(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule HR Meeting
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {!isArchived ? (
              <DropdownMenuItem 
              onSelect={() => setShowArchiveDialog(true)}
                className="text-amber-600"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Employee
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
              onSelect={handleReactivate}
                className="text-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Reactivate Employee
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem 
              onSelect={() => setShowRemoveDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Archive Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to archive {employee.name}? This will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Change their status to "Archived"</li>
              <li>• Remove them from active employee lists</li>
              <li>• Preserve all their data and history</li>
              <li>• Allow them to be restored later</li>
            </ul>
            <p className="text-sm font-medium">
              This action can be undone by restoring the employee.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleArchive}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? "Archiving..." : "Archive Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Remove Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently remove {employee.name}? This will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Permanently delete all employee data</li>
              <li>• Remove all documents and notes</li>
              <li>• Delete performance history</li>
              <li>• This action CANNOT be undone</li>
            </ul>
            <p className="text-sm font-medium text-red-600">
              ⚠️ This action is permanent and cannot be undone!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemove}
              disabled={loading}
            >
              {loading ? "Removing..." : "Permanently Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        open={showMeetingDialog}
        onOpenChange={setShowMeetingDialog}
        employee={employee}
        onSubmit={handleScheduleMeeting}
        loading={loading}
      />
    </>
  )
}

// Schedule Meeting Dialog Component
interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
  onSubmit: (formData: any) => void
  loading: boolean
}

function ScheduleMeetingDialog({ open, onOpenChange, employee, onSubmit, loading }: ScheduleMeetingDialogProps) {
  const [formData, setFormData] = useState({
    meeting_type: "HR_Review",
    title: "",
    description: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "60",
    location: "",
    generate_google_meet: true,
    notes: ""
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        meeting_type: "HR_Review",
        title: "",
        description: "",
        scheduled_date: "",
        scheduled_time: "",
        duration_minutes: "60",
        location: "",
        generate_google_meet: true,
        notes: ""
      })
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`)
    
    onSubmit({
      ...formData,
      scheduled_date: scheduledDateTime.toISOString(),
      duration_minutes: parseInt(formData.duration_minutes)
    })
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule HR Meeting
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meeting_type">Meeting Type</Label>
              <Select value={formData.meeting_type} onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR_Review">HR Review</SelectItem>
                  <SelectItem value="Performance_Review">Performance Review</SelectItem>
                  <SelectItem value="Disciplinary">Disciplinary</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Exit_Interview">Exit Interview</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={formData.duration_minutes} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Quarterly Performance Review"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Meeting agenda and objectives..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_date">Date</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="scheduled_time">Time</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Conference Room A or Google Meet"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
