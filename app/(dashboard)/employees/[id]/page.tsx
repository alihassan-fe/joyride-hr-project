import { sql } from "@/lib/sql"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { DocumentUpload } from "@/components/document-upload"
import { EmployeeNotes } from "@/components/employee-notes"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  start_date: string
  pto_balance: number
}

interface Document {
  id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

interface Note {
  id: number
  employee_id: number
  note: string
  created_by: string
  created_at: string
}

async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const result = await sql`
      SELECT id, name, email, role, start_date, pto_balance
      FROM employees 
      WHERE id = ${id}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching employee:", error)
    return null
  }
}

async function getEmployeeDocuments(employeeId: string): Promise<Document[]> {
  try {
    const result = await sql`
      SELECT id, document_type, file_name, file_path, file_size, uploaded_at
      FROM employee_documents 
      WHERE employee_id = ${employeeId}
      ORDER BY document_type, uploaded_at DESC
    `
    return result as Document[]
  } catch (error) {
    console.error("Error fetching documents:", error)
    return []
  }
}

async function getEmployeeNotes(employeeId: string): Promise<Note[]> {
  try {
    const result = await sql`
      SELECT id, employee_id, note, created_by, created_at
      FROM employee_notes 
      WHERE employee_id = ${employeeId}
      ORDER BY created_at DESC
    `
    return result as Note[]
  } catch (error) {
    console.error("Error fetching notes:", error)
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
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

      {/* Employee Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <Badge variant="secondary">{employee.role}</Badge>
                </div>
              </div>
            </div>

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

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">PTO Balance</p>
                <p className="text-lg font-semibold">{employee.pto_balance} days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents and Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents */}
        <div>
          <DocumentUpload
            employeeId={Number(params.id)}
            documents={documents}
            onDocumentChange={() => window.location.reload()}
          />
        </div>

        {/* Notes */}
        <div>
          <EmployeeNotes employeeId={Number(params.id)} notes={notes} onNotesChange={() => window.location.reload()} />
        </div>
      </div>
    </div>
  )
}
