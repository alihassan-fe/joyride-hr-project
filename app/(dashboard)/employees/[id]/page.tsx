import { sql } from "@/lib/sql"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, User, Mail, Calendar, Clock, MapPin, Phone, Star, 
  Building, Users, FileText, Activity, Archive, Trash2, Phone as PhoneIcon,
  Video, Mail as MailIcon, Calendar as CalendarIcon
} from "lucide-react"
import Link from "next/link"
import { Employee, Document, Note, EmployeeKPI, EmployeeActivityLog, EmployeeMeeting } from "@/lib/types"

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
import EmployeeOverviewTab from "@/components/employee-overview-tab"
import EmployeePerformanceTab from "@/components/employee-performance-tab"
import EmployeeActivityLogTab from "@/components/employee-activity-log-tab"
import EmployeeActions from "@/components/employee-actions"

// Enhanced employee data fetching
async function getEmployee(id: string): Promise<ExtendedEmployee | null> {
  try {
    const result = await sql`
      SELECT 
        e.id, e.name, e.email, e.role, e.start_date, e.pto_balance, 
        e.location, e.phone, e.department, e.current_performance_score,
        e.first_name, e.last_name, e.age, e.gender, e.address, e.city, 
        e.state, e.zip_code, e.client_id, e.manager_id, e.employment_status,
        e.archived_at, e.archived_by, e.updated_at,
        -- Manager information
        m.name as manager_name, m.email as manager_email,
        -- Client information
        c.name as client_name, c.description as client_description
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      LEFT JOIN clients c ON e.client_id = c.id::text
      WHERE e.id = ${id}
    `
    return (result[0] as ExtendedEmployee) || null
  } catch (error) {
    console.error("Error fetching employee:", error)
    return null
  }
}

async function getEmployeeDocuments(employeeId: string): Promise<ExtendedDocument[]> {
  try {
    const result = await sql`
      SELECT 
        ed.id, ed.employee_id, ed.document_type, ed.file_name, ed.file_path, 
        ed.file_size, ed.uploaded_at, ed.category_id, ed.uploaded_by, 
        ed.file_type, ed.is_verified, ed.verified_by, ed.verified_at,
        -- Category information
        edc.name as category_name, edc.description as category_description,
        edc.max_files, edc.is_required,
        -- Uploader information
        u.name as uploader_name,
        -- Verifier information
        v.name as verifier_name
      FROM employee_documents ed
      LEFT JOIN employee_document_categories edc ON ed.category_id = edc.id
      LEFT JOIN employees u ON ed.uploaded_by = u.id
      LEFT JOIN employees v ON ed.verified_by = v.id
      WHERE ed.employee_id = ${employeeId}
      ORDER BY edc.sort_order, ed.uploaded_at DESC
    `
    return result as ExtendedDocument[]
  } catch (error) {
    console.error("Error fetching documents:", error)
    return []
  }
}

async function getEmployeeNotes(employeeId: string): Promise<ExtendedNote[]> {
  try {
    const result = await sql`
      SELECT 
        en.id, en.employee_id, en.note, en.note_text, en.created_by, en.created_at,
        -- Creator information
        c.name as creator_name
      FROM employee_notes en
      LEFT JOIN employees c ON en.created_by = c.id
      WHERE en.employee_id = ${employeeId}
      ORDER BY en.created_at DESC
    `
    return result as ExtendedNote[]
  } catch (error) {
    console.error("Error fetching notes:", error)
    return []
  }
}

async function getEmployeeKPIs(employeeId: string): Promise<EmployeeKPI[]> {
  try {
    const result = await sql`
      SELECT 
        ek.id, ek.employee_id, ek.kpi_name, ek.kpi_description, ek.target_value,
        ek.current_value, ek.unit, ek.is_department_default, ek.department_id,
        ek.is_active, ek.created_by, ek.created_at, ek.updated_at,
        -- Department information
        d.name as department_name,
        -- Creator information
        c.name as creator_name
      FROM employee_kpis ek
      LEFT JOIN departments d ON ek.department_id = d.id
      LEFT JOIN employees c ON ek.created_by = c.id
      WHERE ek.employee_id = ${employeeId} AND ek.is_active = true
      ORDER BY ek.created_at DESC
    `
    return result as EmployeeKPI[]
  } catch (error) {
    console.error("Error fetching KPIs:", error)
    return []
  }
}

async function getEmployeeActivityLog(employeeId: string): Promise<EmployeeActivityLog[]> {
  try {
    const result = await sql`
      SELECT 
        eal.id, eal.employee_id, eal.actor_id, eal.action_type, eal.action_details,
        eal.ip_address, eal.user_agent, eal.created_at,
        -- Actor information (join with users table since actor_id references users)
        u.name as actor_name, u.email as actor_email
      FROM employee_activity_log eal
      LEFT JOIN users u ON eal.actor_id = u.id
      WHERE eal.employee_id = ${employeeId}
      ORDER BY eal.created_at DESC
      LIMIT 100
    `
    return result as EmployeeActivityLog[]
  } catch (error) {
    console.error("Error fetching activity log:", error)
    return []
  }
}

async function getEmployeeMeetings(employeeId: string): Promise<ExtendedEmployeeMeeting[]> {
  try {
    const result = await sql`
      SELECT 
        em.id, em.employee_id, em.meeting_type, em.title, em.description,
        em.scheduled_date, em.duration_minutes, em.location, em.google_meet_url,
        em.google_calendar_id, em.attendees, em.status, em.notes, em.created_by,
        em.created_at, em.updated_at,
        -- Creator information
        c.name as creator_name
      FROM employee_meetings em
      LEFT JOIN employees c ON em.created_by = c.id
      WHERE em.employee_id = ${employeeId}
      ORDER BY em.scheduled_date DESC
      LIMIT 50
    `
    return result as ExtendedEmployeeMeeting[]
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return []
  }
}

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employee = await getEmployee(params.id)

  if (!employee) {
    notFound()
  }

  const documents = await getEmployeeDocuments(params.id)
  const notes = await getEmployeeNotes(params.id)
  const kpis = await getEmployeeKPIs(params.id)
  const activityLog = await getEmployeeActivityLog(params.id)
  console.log("🚀 ~ EmployeeProfilePage ~ activityLog:", activityLog)
  const meetings = await getEmployeeMeetings(params.id)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return "bg-green-100 text-green-800"
      case 'Inactive': return "bg-yellow-100 text-yellow-800"
      case 'Archived': return "bg-gray-100 text-gray-800"
      case 'Terminated': return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">Employee Profile</p>
          </div>
        </div>
        
        {/* Employee Actions */}
        <EmployeeActions employee={employee} />
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">{employee.client_name || 'Not assigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{employee.department || 'Not assigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">PTO Balance</p>
                <p className="text-sm text-muted-foreground">{employee.pto_balance} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-sm text-muted-foreground">
                  {employee.current_performance_score ? `${employee.current_performance_score}/10` : 'Not rated'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(employee.employment_status || 'Active')}>
          {employee.employment_status || 'Active'}
        </Badge>
        {employee.archived_at && (
          <Badge variant="outline">
            Archived on {formatDate(employee.archived_at)}
          </Badge>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EmployeeOverviewTab 
            employee={employee}
            documents={documents}
            notes={notes}
            meetings={meetings}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <EmployeePerformanceTab 
            employee={employee}
            kpis={kpis}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <EmployeeActivityLogTab 
            activityLog={activityLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
