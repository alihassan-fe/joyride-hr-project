import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"

export async function POST(req: NextRequest) {
  try {
    const sql = getSql()
    
    console.log('Fixing candidate status mapping...')
    
    // First, let's check what candidates we have and their current status
    const candidates = await sql`
      SELECT id, name, recommendation, status_id 
      FROM candidates 
      ORDER BY created_at DESC
    `
    
    console.log(`Found ${candidates.length} candidates`)
    
    // Check what statuses exist
    const statuses = await sql`
      SELECT id, name FROM candidate_statuses ORDER BY sort_order
    `
    
    console.log('Available statuses:', statuses.map((s: any) => `${s.id}: ${s.name}`))
    
    // Fix the mapping for candidates that might have been affected by the typo
    const result = await sql`
      UPDATE candidates 
      SET status_id = (
        SELECT id FROM candidate_statuses 
        WHERE name = CASE 
          WHEN candidates.recommendation = 'Call Immediately' THEN 'Call Immediately'
          WHEN candidates.recommendation = 'Shortlist' THEN 'Shortlist'
          WHEN candidates.recommendation = 'Remove' THEN 'Remove'
          ELSE 'Shortlist' -- Default fallback
        END
        LIMIT 1
      )
      WHERE status_id IS NULL OR status_id = 0
    `
    
    console.log('✅ Candidate status mapping fixed!')
    
    // Show the updated data
    const updatedCandidates = await sql`
      SELECT 
        c.id, 
        c.name, 
        c.recommendation, 
        c.status_id,
        cs.name as status_name
      FROM candidates c
      LEFT JOIN candidate_statuses cs ON c.status_id = cs.id
      ORDER BY c.created_at DESC
    `
    
    console.log('\nUpdated candidates:')
    updatedCandidates.forEach((c: any) => {
      console.log(`${c.name}: recommendation="${c.recommendation}" -> status="${c.status_name}" (ID: ${c.status_id})`)
    })
    
    // Count by status
    const statusCounts = await sql`
      SELECT 
        cs.name as status_name,
        COUNT(*) as count
      FROM candidates c
      JOIN candidate_statuses cs ON c.status_id = cs.id
      GROUP BY cs.name, cs.sort_order
      ORDER BY cs.sort_order
    `
    
    console.log('\nStatus counts:')
    statusCounts.forEach((s: any) => {
      console.log(`${s.status_name}: ${s.count}`)
    })
    
    return NextResponse.json({
      success: true,
      message: "Candidate status mapping fixed successfully",
      candidates: updatedCandidates,
      statusCounts: statusCounts
    })
    
  } catch (error) {
    console.error('❌ Error fixing candidate statuses:', error)
    return NextResponse.json({ 
      error: "Failed to fix candidate statuses",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
