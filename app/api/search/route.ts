import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function GET(req: NextRequest) {
  const sql = getSql()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const type = searchParams.get("type") || "all" // "candidates", "employees", "all"
  const limit = Math.min(Number(searchParams.get("limit") || 10), 50)

  try {
    let results: any[] = []

    if (type === "all" || type === "candidates") {
      const candidates = await sql/* sql */`
        SELECT 
          'candidate' as type,
          id,
          name,
          email,
          phone,
          department,
          status_id,
          created_at
        FROM candidates 
        WHERE 
          name ILIKE ${`%${query}%`} OR 
          email ILIKE ${`%${query}%`} OR
          phone ILIKE ${`%${query}%`}
        ORDER BY 
          CASE 
            WHEN name ILIKE ${`${query}%`} THEN 1
            WHEN email ILIKE ${`${query}%`} THEN 2
            ELSE 3
          END,
          name ASC
        LIMIT ${limit}
      `
      results.push(...candidates)
    }

    if (type === "all" || type === "employees") {
      const employees = await sql/* sql */`
        SELECT 
          'employee' as type,
          id,
          name,
          email,
          phone,
          department,
          role,
          created_at
        FROM employees 
        WHERE 
          name ILIKE ${`%${query}%`} OR 
          email ILIKE ${`%${query}%`} OR
          phone ILIKE ${`%${query}%`}
        ORDER BY 
          CASE 
            WHEN name ILIKE ${`${query}%`} THEN 1
            WHEN email ILIKE ${`${query}%`} THEN 2
            ELSE 3
          END,
          name ASC
        LIMIT ${limit}
      `
      results.push(...employees)
    }

    // Sort combined results by relevance and type
    results.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const queryLower = query.toLowerCase()
      
      // Exact matches first
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1
      if (!aName.startsWith(queryLower) && bName.startsWith(queryLower)) return 1
      
      // Then by type (employees first)
      if (a.type === 'employee' && b.type === 'candidate') return -1
      if (a.type === 'candidate' && b.type === 'employee') return 1
      
      // Finally by name
      return aName.localeCompare(bName)
    })

    return NextResponse.json({ 
      data: results.slice(0, limit),
      total: results.length 
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
