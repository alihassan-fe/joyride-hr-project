"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Activity, User, FileText, StickyNote, Star, Calendar, 
  Archive, Trash2, Mail, Phone, Clock, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Eye, Download
} from "lucide-react"
import { EmployeeActivityLog } from "@/lib/types"

interface EmployeeActivityLogTabProps {
  activityLog: EmployeeActivityLog[]
}

export default function EmployeeActivityLogTab({
  activityLog
}: EmployeeActivityLogTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'profile_updated': return <User className="h-4 w-4" />
      case 'document_uploaded': return <FileText className="h-4 w-4" />
      case 'document_deleted': return <FileText className="h-4 w-4" />
      case 'note_added': return <StickyNote className="h-4 w-4" />
      case 'note_updated': return <StickyNote className="h-4 w-4" />
      case 'note_deleted': return <StickyNote className="h-4 w-4" />
      case 'performance_updated': return <Star className="h-4 w-4" />
      case 'kpi_added': return <TrendingUp className="h-4 w-4" />
      case 'kpi_updated': return <TrendingUp className="h-4 w-4" />
      case 'kpi_score_added': return <Star className="h-4 w-4" />
      case 'pto_requested': return <Calendar className="h-4 w-4" />
      case 'pto_approved': return <CheckCircle className="h-4 w-4" />
      case 'pto_rejected': return <AlertTriangle className="h-4 w-4" />
      case 'employee_archived': return <Archive className="h-4 w-4" />
      case 'employee_restored': return <CheckCircle className="h-4 w-4" />
      case 'meeting_scheduled': return <Calendar className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'profile_updated': return "bg-blue-100 text-blue-800"
      case 'document_uploaded': return "bg-green-100 text-green-800"
      case 'document_deleted': return "bg-red-100 text-red-800"
      case 'note_added': return "bg-purple-100 text-purple-800"
      case 'note_updated': return "bg-purple-100 text-purple-800"
      case 'note_deleted': return "bg-red-100 text-red-800"
      case 'performance_updated': return "bg-orange-100 text-orange-800"
      case 'kpi_added': return "bg-green-100 text-green-800"
      case 'kpi_updated': return "bg-blue-100 text-blue-800"
      case 'kpi_score_added': return "bg-orange-100 text-orange-800"
      case 'pto_requested': return "bg-yellow-100 text-yellow-800"
      case 'pto_approved': return "bg-green-100 text-green-800"
      case 'pto_rejected': return "bg-red-100 text-red-800"
      case 'employee_archived': return "bg-gray-100 text-gray-800"
      case 'employee_restored': return "bg-green-100 text-green-800"
      case 'meeting_scheduled': return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getActionDescription = (actionType: string, details?: any) => {
    switch (actionType) {
      case 'profile_updated':
        return "Profile information was updated"
      case 'document_uploaded':
        return `Document "${details?.document_name || 'Unknown'}" was uploaded`
      case 'document_deleted':
        return `Document "${details?.document_name || 'Unknown'}" was deleted`
      case 'note_added':
        return "A new note was added"
      case 'note_updated':
        return "A note was updated"
      case 'note_deleted':
        return "A note was deleted"
      case 'performance_updated':
        return `Performance score updated to ${details?.score || 'Unknown'}`
      case 'kpi_added':
        return `New KPI "${details?.kpi_name || 'Unknown'}" was added`
      case 'kpi_updated':
        return `KPI "${details?.kpi_name || 'Unknown'}" was updated`
      case 'kpi_score_added':
        return `New score ${details?.score || 'Unknown'} was added to KPI`
      case 'pto_requested':
        return `PTO request submitted for ${details?.days_requested || 'Unknown'} days`
      case 'pto_approved':
        return "PTO request was approved"
      case 'pto_rejected':
        return "PTO request was rejected"
      case 'employee_archived':
        return "Employee was archived"
      case 'employee_restored':
        return "Employee was restored from archive"
      case 'meeting_scheduled':
        return `Meeting "${details?.meeting_title || 'Unknown'}" was scheduled`
      default:
        return "Action performed"
    }
  }

  const getActionDetails = (actionType: string, details?: any) => {
    if (!details) return null

    switch (actionType) {
      case 'profile_updated':
        return (
          <div className="text-sm text-muted-foreground">
            {details.changed_fields && (
              <p>Changed fields: {details.changed_fields.join(', ')}</p>
            )}
          </div>
        )
      case 'document_uploaded':
      case 'document_deleted':
        return (
          <div className="text-sm text-muted-foreground">
            {details.document_type && <p>Type: {details.document_type}</p>}
            {details.file_size && <p>Size: {(details.file_size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        )
      case 'note_added':
      case 'note_updated':
        return (
          <div className="text-sm text-muted-foreground">
            {details.note_preview && (
              <p>Preview: {details.note_preview.substring(0, 100)}...</p>
            )}
          </div>
        )
      case 'performance_updated':
        return (
          <div className="text-sm text-muted-foreground">
            {details.previous_score && <p>Previous: {details.previous_score}</p>}
            {details.new_score && <p>New: {details.new_score}</p>}
          </div>
        )
      case 'kpi_added':
      case 'kpi_updated':
        return (
          <div className="text-sm text-muted-foreground">
            {details.target_value && <p>Target: {details.target_value}</p>}
            {details.unit && <p>Unit: {details.unit}</p>}
          </div>
        )
      case 'kpi_score_added':
        return (
          <div className="text-sm text-muted-foreground">
            {details.comment && (
              <p>Comment: {details.comment.substring(0, 100)}...</p>
            )}
          </div>
        )
      case 'pto_requested':
        return (
          <div className="text-sm text-muted-foreground">
            {details.start_date && <p>From: {details.start_date}</p>}
            {details.end_date && <p>To: {details.end_date}</p>}
            {details.reason && (
              <p>Reason: {details.reason.substring(0, 100)}...</p>
            )}
          </div>
        )
      case 'pto_approved':
      case 'pto_rejected':
        return (
          <div className="text-sm text-muted-foreground">
            {details.manager_comment && (
              <p>Manager comment: {details.manager_comment.substring(0, 100)}...</p>
            )}
          </div>
        )
      case 'meeting_scheduled':
        return (
          <div className="text-sm text-muted-foreground">
            {details.meeting_type && <p>Type: {details.meeting_type}</p>}
            {details.scheduled_date && <p>Date: {details.scheduled_date}</p>}
            {details.duration && <p>Duration: {details.duration} minutes</p>}
          </div>
        )
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activityLog.length}</div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activityLog.filter(log => ['document_uploaded', 'note_added', 'kpi_added'].includes(log.action_type)).length}
              </div>
              <div className="text-sm text-muted-foreground">Additions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activityLog.filter(log => ['profile_updated', 'note_updated', 'kpi_updated'].includes(log.action_type)).length}
              </div>
              <div className="text-sm text-muted-foreground">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {activityLog.filter(log => ['document_deleted', 'note_deleted'].includes(log.action_type)).length}
              </div>
              <div className="text-sm text-muted-foreground">Deletions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length > 0 ? (
            <div className="space-y-4">
              {activityLog.map((log) => {
                const timestamp = formatTimestamp(log.created_at)
                
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    {/* Action Icon */}
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getActionIcon(log.action_type)}
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(log.action_type)}>
                            {log.action_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.actor_name || 'Unknown User'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{timestamp.date}</div>
                          <div>{timestamp.time}</div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm font-medium">
                          {getActionDescription(log.action_type, log.action_details)}
                        </p>
                      </div>

                      {/* Additional Details */}
                      {log.action_details && getActionDetails(log.action_type, log.action_details)}

                      {/* Technical Details */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {log.ip_address && (
                            <span>IP: {log.ip_address}</span>
                          )}
                          {log.user_agent && (
                            <span className="truncate">
                              Browser: {log.user_agent.substring(0, 50)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Most Active Users */}
            <div>
              <h4 className="font-medium mb-2">Most Active Users</h4>
              <div className="space-y-2">
                {Object.entries(
                  activityLog.reduce((acc, log) => {
                    const actor = log.actor_name || 'Unknown'
                    acc[actor] = (acc[actor] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([actor, count]) => (
                    <div key={actor} className="flex items-center justify-between text-sm">
                      <span className="truncate">{actor}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most Common Actions */}
            <div>
              <h4 className="font-medium mb-2">Most Common Actions</h4>
              <div className="space-y-2">
                {Object.entries(
                  activityLog.reduce((acc, log) => {
                    acc[log.action_type] = (acc[log.action_type] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between text-sm">
                      <span className="truncate">
                        {action.replace('_', ' ').toUpperCase()}
                      </span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {activityLog.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-sm">
                    {getActionIcon(log.action_type)}
                    <span className="truncate">
                      {getActionDescription(log.action_type, log.action_details)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatTimestamp(log.created_at).time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
