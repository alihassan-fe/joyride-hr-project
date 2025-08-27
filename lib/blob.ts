import { put, del, list } from '@vercel/blob'
import { auth } from '@/lib/auth-next'

export interface BlobUploadResult {
  url: string
  pathname: string
  size: number
  uploadedAt: Date
}

export async function uploadToBlob(
  file: File,
  employeeId: string,
  documentType: string
): Promise<BlobUploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `${documentType}_${timestamp}.pdf`
    const blobPath = `employees/${employeeId}/${fileName}`

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }
  } catch (error) {
    console.error('Error uploading to blob:', error)
    throw new Error('Failed to upload file to cloud storage')
  }
}

export async function deleteFromBlob(pathname: string): Promise<void> {
  try {
    await del(pathname)
  } catch (error) {
    console.error('Error deleting from blob:', error)
    throw new Error('Failed to delete file from cloud storage')
  }
}

export async function listEmployeeDocuments(employeeId: string): Promise<any[]> {
  try {
    const { blobs } = await list({
      prefix: `employees/${employeeId}/`,
    })
    return blobs
  } catch (error) {
    console.error('Error listing employee documents:', error)
    return []
  }
}

export async function validateFileUpload(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  return { valid: true }
}

export function generateBlobPath(employeeId: string, documentType: string): string {
  const timestamp = Date.now()
  const fileName = `${documentType}_${timestamp}.pdf`
  return `employees/${employeeId}/${fileName}`
}
