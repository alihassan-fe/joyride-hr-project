import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"

// Debug endpoint to help troubleshoot PTO issues
export async function GET(req: NextRequest) {
  try {
    const sql = getSql()
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ptoId = searchParams.get("id")

    // Get user information
    const userRole = (session.user as any)?.role || "Authenticated"
    const userEmail = session.user?.email
    const userName = session.user?.name

    // Get PTO request if ID provided
    let ptoRequest = null
    if (ptoId) {
      const ptoIdInt = parseInt(ptoId, 10)
      if (!isNaN(ptoIdInt)) {
        const [pto] = await sql`
          SELECT * FROM pto_requests WHERE id = ${ptoIdInt}
        `
        ptoRequest = pto
      }
    }

    // Get all PTO requests for debugging
    const allPtoRequests = await sql`
      SELECT id, employee_id, employee_name, manager_id, manager_name, status, created_at
      FROM pto_requests 
      ORDER BY created_at DESC 
      LIMIT 10
    `

    // Get user's role information
    const [userInfo] = await sql`
      SELECT id, email, name, role FROM users WHERE email = ${userEmail}
    `

    return NextResponse.json({
      debug: {
        session: {
          user_email: userEmail,
          user_name: userName,
          user_role: userRole
        },
        user_info: userInfo,
        pto_request: ptoRequest,
        all_pto_requests: allPtoRequests,
        authorization_check: ptoRequest ? {
          isAdmin: userRole === "Admin",
          isHR: userRole === "HR", 
          isManager: userRole === "Manager",
          isAssignedManager: ptoRequest.manager_id === userEmail || 
                           ptoRequest.manager_id === userName ||
                           ptoRequest.manager_id === userEmail?.toLowerCase() ||
                           ptoRequest.manager_id === userName?.toLowerCase(),
          isOwner: ptoRequest.employee_id === userEmail || 
                  ptoRequest.employee_id === userName ||
                  ptoRequest.employee_id === userEmail?.toLowerCase() ||
                  ptoRequest.employee_id === userName?.toLowerCase(),
          canApproveDeny: userRole === "Admin" || userRole === "HR" || 
                         (userRole === "Manager" && (ptoRequest.manager_id === userEmail || 
                          ptoRequest.manager_id === userName ||
                          ptoRequest.manager_id === userEmail?.toLowerCase() ||
                          ptoRequest.manager_id === userName?.toLowerCase())),
          canCancel: userRole === "Admin" || userRole === "HR" || 
                    (userRole === "Manager" && (ptoRequest.manager_id === userEmail || 
                     ptoRequest.manager_id === userName ||
                     ptoRequest.manager_id === userEmail?.toLowerCase() ||
                     ptoRequest.manager_id === userName?.toLowerCase() )) ||
                    (ptoRequest.employee_id === userEmail || 
                     ptoRequest.employee_id === userName ||
                     ptoRequest.employee_id === userEmail?.toLowerCase() ||
                     ptoRequest.employee_id === userName?.toLowerCase())
        } : null
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
