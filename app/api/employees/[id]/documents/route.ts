import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/sql"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

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
    const employeeId = Number.parseInt(params.id)

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
    const employeeId = Number.parseInt(params.id)
    const formData = await request.formData()

    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as string

    if (!file || !documentType) {
      return NextResponse.json({ error: "File and document type required" }, { status: 400 })
    }

    if (!DOCUMENT_TYPES.includes(documentType as any)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "employees", employeeId.toString())
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${documentType}_${timestamp}.pdf`
    const filePath = join(uploadsDir, fileName)
    const publicPath = `/uploads/employees/${employeeId}/${fileName}`

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Check if document already exists and delete old one
    const existingDoc = await sql`
      SELECT id, file_path FROM employee_documents 
      WHERE employee_id = ${employeeId} AND document_type = ${documentType}
    `

    if (existingDoc.length > 0) {
      // Update existing document
      await sql`
        UPDATE employee_documents 
        SET file_name = ${fileName}, file_path = ${publicPath}, file_size = ${file.size}, uploaded_at = NOW()
        WHERE employee_id = ${employeeId} AND document_type = ${documentType}
      `
    } else {
      // Insert new document
      await sql`
        INSERT INTO employee_documents (employee_id, document_type, file_name, file_path, file_size)
        VALUES (${employeeId}, ${documentType}, ${fileName}, ${publicPath}, ${file.size})
      `
    }

    return NextResponse.json({
      message: "Document uploaded successfully",
      fileName,
      filePath: publicPath,
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const employeeId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("type")

    if (!documentType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 })
    }

    await sql`
      DELETE FROM employee_documents 
      WHERE employee_id = ${employeeId} AND document_type = ${documentType}
    `

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
