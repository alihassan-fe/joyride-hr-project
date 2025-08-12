import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"

// Admin endpoint to get document statistics
export async function GET(request: NextRequest) {
  try {
    // Get document completion stats
    const documentStats = await sql`
      SELECT 
        document_type,
        COUNT(*) as count
      FROM employee_documents
      GROUP BY document_type
      ORDER BY count DESC
    `

    // Get employee document completion stats
    const employeeStats = await sql`
      SELECT 
        e.id,
        e.name,
        e.email,
        e.role,
        COUNT(ed.id) as document_count,
        CASE 
          WHEN COUNT(ed.id) = 7 THEN 'complete'
          WHEN COUNT(ed.id) > 0 THEN 'partial'
          ELSE 'none'
        END as completion_status
      FROM employees e
      LEFT JOIN employee_documents ed ON e.id = ed.employee_id
      GROUP BY e.id, e.name, e.email, e.role
      ORDER BY document_count DESC, e.name
    `

    // Get recent uploads
    const recentUploads = await sql`
      SELECT 
        ed.id,
        ed.document_type,
        ed.file_name,
        ed.uploaded_at,
        e.name as employee_name,
        e.email as employee_email
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      ORDER BY ed.uploaded_at DESC
      LIMIT 10
    `

    // Calculate overall stats
    const totalEmployees = employeeStats.length
    const employeesWithAllDocs = employeeStats.filter((emp: any) => emp.completion_status === "complete").length
    const employeesWithSomeDocs = employeeStats.filter((emp: any) => emp.completion_status === "partial").length
    const employeesWithNoDocs = employeeStats.filter((emp: any) => emp.completion_status === "none").length

    return NextResponse.json({
      overview: {
        totalEmployees,
        employeesWithAllDocs,
        employeesWithSomeDocs,
        employeesWithNoDocs,
        completionRate: totalEmployees > 0 ? Math.round((employeesWithAllDocs / totalEmployees) * 100) : 0,
      },
      documentTypeStats: documentStats,
      employeeCompletionStats: employeeStats,
      recentUploads,
    })
  } catch (error) {
    console.error("Error fetching document stats:", error)
    return NextResponse.json({ error: "Failed to fetch document statistics" }, { status: 500 })
  }
}
