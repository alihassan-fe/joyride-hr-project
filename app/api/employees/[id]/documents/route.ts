import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { auth } from "@/lib/auth-next"
import { uploadToBlob, deleteFromBlob, validateFileUpload } from "@/lib/blob"

const DOCUMENT_TYPES = [
  "tax_document",
  "doctor_note",
  "school_diploma",
  "cips",
  "bank_statement",
  "js_form",
  "contract_agreement",
] as const

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employeeId = params.id

    const documents = await sql`
      SELECT id, employee_id, document_type, file_name, file_path, file_size, uploaded_at
      FROM employee_documents 
      WHERE employee_id = ${employeeId}
      ORDER BY document_type, uploaded_at DESC
    `

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id
    const formData = await request.formData()

    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string

    if (!file || !documentType) {
      return NextResponse.json({ error: "File and document type required" }, { status: 400 })
    }

    if (!DOCUMENT_TYPES.includes(documentType as any)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    // Validate file using blob utility
    const validation = await validateFileUpload(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get the current user's ID
    const currentUserId = (session.user as any).id

    // Check if document already exists and get old file path for deletion
    const existingDoc = await sql`
      SELECT id, file_path FROM employee_documents 
      WHERE employee_id = ${employeeId} AND document_type = ${documentType}
    `

    // Upload to Vercel Blob Storage
    const blobResult = await uploadToBlob(file, employeeId, documentType)

    // Update database
    if (existingDoc.length > 0) {
      // Delete old file from blob storage if it exists
      if (existingDoc[0].file_path && existingDoc[0].file_path.startsWith('https://')) {
        try {
          // Extract pathname from URL for deletion
          const url = new URL(existingDoc[0].file_path)
          const pathname = url.pathname.substring(1) // Remove leading slash
          await deleteFromBlob(pathname)
        } catch (error) {
          console.warn('Failed to delete old file from blob:', error)
        }
      }

      // Update existing document
      await sql`
        UPDATE employee_documents 
        SET file_name = ${file.name}, file_path = ${blobResult.url}, file_size = ${blobResult.size}, uploaded_at = NOW(), uploaded_by = ${currentUserId}
        WHERE employee_id = ${employeeId} AND document_type = ${documentType}
      `
    } else {
      // Insert new document
      await sql`
        INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size, file_url, uploaded_by)
        VALUES (${employeeId}, ${documentType}, ${file.name}, ${blobResult.url}, ${blobResult.size}, ${blobResult.url}, ${currentUserId})
      `
    }

    return NextResponse.json({
      message: "Document uploaded successfully",
      fileName: file.name,
      filePath: blobResult.url,
      fileSize: blobResult.size,
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ 
      error: "Failed to upload document", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employeeId = params.id
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("type")

    if (!documentType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 })
    }

    // Get document info before deletion
    const document = await sql`
      SELECT file_path FROM employee_documents 
      WHERE employee_id = ${employeeId} AND document_type = ${documentType}
    `

    if (document.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Delete from blob storage if it's a blob URL
    if (document[0].file_path && document[0].file_path.startsWith('https://')) {
      try {
        const url = new URL(document[0].file_path)
        const pathname = url.pathname.substring(1) // Remove leading slash
        await deleteFromBlob(pathname)
      } catch (error) {
        console.warn('Failed to delete file from blob:', error)
        // Continue with database deletion even if blob deletion fails
      }
    }

    // Delete from database
    await sql`
      DELETE FROM employee_documents 
      WHERE employee_id = ${employeeId} AND document_type = ${documentType}
    `

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ 
      error: "Failed to delete document", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
