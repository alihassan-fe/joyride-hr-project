import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-next"
import { migrateLocalFilesToBlob, cleanupLocalFiles, getMigrationStatus } from "@/lib/migrate-files"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (you can customize this logic)
    const isAdmin = (session.user as any).role === 'admin' || (session.user as any).email?.includes('admin')
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const status = await getMigrationStatus()
    
    return NextResponse.json({
      status,
      message: "Migration status retrieved successfully"
    })
  } catch (error) {
    console.error("Error getting migration status:", error)
    return NextResponse.json({ 
      error: "Failed to get migration status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = (session.user as any).role === 'admin' || (session.user as any).email?.includes('admin')
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { action } = await request.json()

    if (action === 'migrate') {
      const result = await migrateLocalFilesToBlob()
      return NextResponse.json(result)
    } else if (action === 'cleanup') {
      const result = await cleanupLocalFiles()
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'migrate' or 'cleanup'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error during migration:", error)
    return NextResponse.json({ 
      error: "Migration failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
