import { sql } from "@/lib/sql"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShiftCalendar } from "@/components/shift-calendar"
import { Employee } from "@/lib/types"

async function getEmployees(): Promise<Employee[]> {
  try {
    const result = await sql`
      SELECT id, name, email, role, start_date, pto_balance, location, phone, department
      FROM employees
      ORDER BY name ASC
    `
    return result as Employee[]
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export default async function ShiftsPage() {
  const employees = await getEmployees()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shift Management</h1>
        <p className="text-muted-foreground">Manage employee shifts and schedules</p>
      </div>

      {/* Shift Calendar */}
      <ShiftCalendar employees={employees} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Day, Evening, Night</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">24/7 Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">✓</p>
            <p className="text-sm text-muted-foreground">Full coverage enabled</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
