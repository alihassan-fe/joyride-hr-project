import { NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET() {
  const sql = getSql()
  try {
    // First, let's get all unique departments from candidates and employees
    let departments = []
    
    try {
      // Get departments from candidates table
      const candidateDepartments = await sql`
        SELECT DISTINCT department as name 
        FROM candidates 
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `
      
      // Get departments from employees table
      const employeeDepartments = await sql`
        SELECT DISTINCT department as name 
        FROM employees 
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department
      `
      
      // Combine and deduplicate
      const allDepartments = [...candidateDepartments, ...employeeDepartments]
      const uniqueDepartments = allDepartments.filter((dept, index, self) => 
        index === self.findIndex(d => d.name === dept.name)
      )
      
      departments = uniqueDepartments
      
      // If no departments found, use defaults based on your actual data
      if (departments.length === 0) {
        departments = [
          { name: "Operations" },
          { name: "Safety" },
          { name: "Maintenance" },
          { name: "Billing" }
        ]
      }
    } catch (error) {
      console.log("Error getting departments, using defaults:", error)
      departments = [
        { name: "Operations" },
        { name: "Safety" },
        { name: "Maintenance" },
        { name: "Billing" }
      ]
    }

    const departmentMetrics = []

    for (const dept of departments) {
      const departmentName = dept.name

      // Get candidate metrics - basic counts only
      let candidateData = {
        total_candidates: 0,
        call_immediately_count: 0,
        remove_count: 0,
        shortlist_count: 0
      }
      
      try {
        // First, let's see what recommendation values actually exist
        const recommendationValues = await sql`
          SELECT DISTINCT cs.name as status_name
          FROM candidates c
          JOIN candidate_statuses cs ON c.status_id = cs.id
          WHERE c.department = ${departmentName}
        `
        console.log(`Status values for ${departmentName}:`, recommendationValues)

        const candidateMetrics = await sql`
          SELECT 
            COUNT(*) as total_candidates,
            COUNT(CASE WHEN cs.name = 'Call Immediately' THEN 1 END) as call_immediately_count,
            COUNT(CASE WHEN cs.name = 'Remove' THEN 1 END) as remove_count,
            COUNT(CASE WHEN cs.name = 'Shortlist' THEN 1 END) as shortlist_count
          FROM candidates c
          JOIN candidate_statuses cs ON c.status_id = cs.id
          WHERE c.department = ${departmentName}
        `
        if (candidateMetrics && candidateMetrics[0]) {
          candidateData = candidateMetrics[0]
          console.log(`Candidate data for ${departmentName}:`, candidateData)
        }
      } catch (error) {
        console.log(`Error fetching candidates for ${departmentName}:`, error)
      }

      // Get employee metrics
      let employeeData = {
        total_employees: 0,
        avg_performance_score: 0
      }
      
      try {
        const employeeMetrics = await sql`
          SELECT 
            COUNT(*) as total_employees,
            AVG(CASE WHEN current_performance_score IS NOT NULL THEN current_performance_score ELSE NULL END) as avg_performance_score
          FROM employees 
          WHERE department = ${departmentName}
        `
        if (employeeMetrics && employeeMetrics[0]) {
          employeeData = employeeMetrics[0]
        }
      } catch (error) {
        console.log(`Error fetching employees for ${departmentName}:`, error)
      }

      // Get recent candidates
      let recentCandidates = []
      try {
        recentCandidates = await sql`
          SELECT name, email, recommendation, created_at
          FROM candidates 
          WHERE department = ${departmentName} 
          ORDER BY created_at DESC
          LIMIT 5
        `
      } catch (error) {
        console.log(`Error fetching recent candidates for ${departmentName}:`, error)
      }

      departmentMetrics.push({
        name: departmentName,
        candidates: {
          total: Number(candidateData.total_candidates) || 0,
          callImmediately: Number(candidateData.call_immediately_count) || 0,
          remove: Number(candidateData.remove_count) || 0,
          shortlist: Number(candidateData.shortlist_count) || 0,
          recent: recentCandidates || []
        },
        employees: {
          total: Number(employeeData.total_employees) || 0,
          avgPerformance: parseFloat((Number(employeeData.avg_performance_score) || 0).toFixed(1))
        }
      })
    }

    console.log("Department metrics generated:", departmentMetrics.length, "departments")
    console.log("Departments found:", departments.map(d => d.name))
    return NextResponse.json({ data: departmentMetrics })
    
  } catch (error) {
    console.error("Error in department metrics API:", error)
    // Return fallback data
    return NextResponse.json({ 
      data: [
        {
          name: "Operations",
          candidates: {
            total: 0,
            callImmediately: 0,
            remove: 0,
            shortlist: 0,
            recent: []
          },
          employees: {
            total: 0,
            avgPerformance: 0
          }
        }
      ]
    })
  }
}
