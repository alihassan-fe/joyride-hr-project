import { sql } from '@/lib/sql'
import { uploadToBlob, deleteFromBlob } from '@/lib/blob'
import { readFile } from 'fs/promises'
import { join } from 'path'

export interface MigrationResult {
  success: boolean
  message: string
  migratedCount?: number
  errors?: string[]
}

export async function migrateLocalFilesToBlob(): Promise<MigrationResult> {
  const errors: string[] = []
  let migratedCount = 0

  try {
    // Get all documents with local file paths
    const documents = await sql`
      SELECT id, employee_id, document_type, file_name, file_path, file_size
      FROM employee_documents 
      WHERE file_path LIKE '/uploads/%'
      ORDER BY employee_id, document_type
    `

    console.log(`Found ${documents.length} local files to migrate`)

    for (const doc of documents) {
      try {
        // Construct local file path
        const localPath = join(process.cwd(), 'public', doc.file_path)
        
        // Read the file
        const fileBuffer = await readFile(localPath)
        
        // Create a File object from the buffer
        const file = new File([fileBuffer], doc.file_name, {
          type: 'application/pdf',
        })

        // Upload to blob storage
        const blobResult = await uploadToBlob(file, doc.employee_id, doc.document_type)

        // Update database with new blob URL
        await sql`
          UPDATE employee_documents 
          SET file_path = ${blobResult.url}, file_size = ${blobResult.size}
          WHERE id = ${doc.id}
        `

        console.log(`Migrated: ${doc.file_name} -> ${blobResult.url}`)
        migratedCount++

      } catch (error) {
        const errorMsg = `Failed to migrate ${doc.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return {
      success: errors.length === 0,
      message: `Migration completed. ${migratedCount} files migrated successfully.`,
      migratedCount,
      errors: errors.length > 0 ? errors : undefined,
    }

  } catch (error) {
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

export async function cleanupLocalFiles(): Promise<MigrationResult> {
  const errors: string[] = []
  let cleanedCount = 0

  try {
    // Get all documents that have been migrated to blob storage
    const migratedDocs = await sql`
      SELECT file_path
      FROM employee_documents 
      WHERE file_path LIKE 'https://%'
    `

    console.log(`Found ${migratedDocs.length} migrated files`)

    // Note: In a production environment, you might want to implement
    // actual file deletion from the local filesystem here
    // For now, we'll just mark them as cleaned

    cleanedCount = migratedDocs.length

    return {
      success: true,
      message: `Cleanup completed. ${cleanedCount} files marked for cleanup.`,
      migratedCount: cleanedCount,
    }

  } catch (error) {
    return {
      success: false,
      message: `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

export async function getMigrationStatus(): Promise<{
  totalDocuments: number
  localFiles: number
  blobFiles: number
  mixedFiles: number
}> {
  try {
    const totalDocs = await sql`
      SELECT COUNT(*) as total FROM employee_documents
    `
    
    const localFiles = await sql`
      SELECT COUNT(*) as count FROM employee_documents 
      WHERE file_path LIKE '/uploads/%'
    `
    
    const blobFiles = await sql`
      SELECT COUNT(*) as count FROM employee_documents 
      WHERE file_path LIKE 'https://%'
    `

    return {
      totalDocuments: Number(totalDocs[0]?.total || 0),
      localFiles: Number(localFiles[0]?.count || 0),
      blobFiles: Number(blobFiles[0]?.count || 0),
      mixedFiles: Number(totalDocs[0]?.total || 0) - Number(localFiles[0]?.count || 0) - Number(blobFiles[0]?.count || 0),
    }
  } catch (error) {
    console.error('Error getting migration status:', error)
    return {
      totalDocuments: 0,
      localFiles: 0,
      blobFiles: 0,
      mixedFiles: 0,
    }
  }
}
