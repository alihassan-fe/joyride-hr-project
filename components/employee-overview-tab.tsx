"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  User, Mail, Phone, Calendar, Clock, MapPin, Building, Users, 
  FileText, StickyNote, CheckCircle, XCircle, AlertTriangle,
  Download, Eye, ExternalLink, Calendar as CalendarIcon, Video
} from "lucide-react"
import { Employee, Document, Note, EmployeeMeeting } from "@/lib/types"
import EmployeeDocumentsAndNotes from "@/components/EmployeeDocumentsAndNotes"

// Extended types for the additional properties from database queries
interface ExtendedEmployee extends Employee {
  client_name?: string
  manager_name?: string
}

interface ExtendedDocument extends Document {
  category_name?: string
  category_description?: string
  uploader_name?: string
}

interface ExtendedNote extends Note {
  creator_name?: string
}

interface ExtendedEmployeeMeeting extends EmployeeMeeting {
  creator_name?: string
}

interface EmployeeOverviewTabProps {
  employee: ExtendedEmployee
  documents: ExtendedDocument[]
  notes: ExtendedNote[]
  meetings: ExtendedEmployeeMeeting[]
}

export default function EmployeeOverviewTab({
  employee,
  documents,
  notes,
  meetings
}: EmployeeOverviewTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateTenure = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""}, ${months} month${months > 1 ? "s" : ""}`
    }
    return `${months} month${months > 1 ? "s" : ""}`
  }

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return "bg-blue-100 text-blue-800"
      case 'Completed': return "bg-green-100 text-green-800"
      case 'Cancelled': return "bg-red-100 text-red-800"
      case 'Rescheduled': return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'HR_Review': return <User className="h-4 w-4" />
      case 'Performance_Review': return <Calendar className="h-4 w-4" />
      case 'Disciplinary': return <AlertTriangle className="h-4 w-4" />
      case 'Onboarding': return <CheckCircle className="h-4 w-4" />
      case 'Exit_Interview': return <XCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-left">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{employee.phone}</p>
                  </div>
                </div>
              )}

              {employee.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{employee.location}</p>
                  </div>
                </div>
              )}

              {employee.gender && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground">{employee.gender}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Employment Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm text-muted-foreground">{employee.client_name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{employee.department || 'Not assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <Badge variant="secondary">{employee.role}</Badge>
                </div>
              </div>

              {employee.manager_name && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">{employee.manager_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(employee.start_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tenure</p>
                  <p className="text-sm text-muted-foreground">{calculateTenure(employee.start_date)}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Address Information */}
          {(employee.address || employee.city || employee.state || employee.zip_code) && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Address Information</h4>
              <div className="text-sm text-muted-foreground">
                {employee.address && <p>{employee.address}</p>}
                {(employee.city || employee.state || employee.zip_code) && (
                  <p>
                    {[employee.city, employee.state, employee.zip_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents and Notes */}
      <EmployeeDocumentsAndNotes
        employeeId={employee.id}
        documents={documents}
        notes={notes}
      />

      {/* Scheduled Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Scheduled Meetings ({meetings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getMeetingTypeIcon(meeting.meeting_type)}
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {meeting.meeting_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getMeetingStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Scheduled</p>
                      <p className="text-muted-foreground">
                        {formatDate(meeting.scheduled_date)} at{' '}
                        {new Date(meeting.scheduled_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">{meeting.duration_minutes} minutes</p>
                    </div>
                    {meeting.location && (
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-muted-foreground">{meeting.location}</p>
                      </div>
                    )}
                    {meeting.creator_name && (
                      <div>
                        <p className="font-medium">Scheduled by</p>
                        <p className="text-muted-foreground">{meeting.creator_name}</p>
                      </div>
                    )}
                  </div>

                  {meeting.description && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm">
                        <span className="font-medium">Description:</span> {meeting.description}
                      </p>
                    </div>
                  )}

                  {meeting.google_meet_url && (
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" asChild>
                        <a href={meeting.google_meet_url} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-2" />
                          Join Google Meet
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No meetings scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
