"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Trash2, Download, Cloud } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const DOCUMENT_TYPES = [
  { value: "tax_document", label: "Tax Document" },
  { value: "doctor_note", label: "Doctor Note" },
  { value: "school_diploma", label: "School Diploma" },
  { value: "cips", label: "CIPS (Personal ID)" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "js_form", label: "JS Form" },
  { value: "contract_agreement", label: "Contract Agreement" },
]

interface Document {
  id: number
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

interface DocumentUploadProps {
  employeeId: string
  documents: Document[]
  onDocumentChange: () => void
}

export function DocumentUpload({ employeeId, documents, onDocumentChange }: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed",
          variant: "destructive",
        })
        return
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      toast({
        title: "Missing information",
        description: "Please select a file and document type",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("documentType", selectedType)

      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: "Document uploaded successfully to cloud storage",
        })
        setSelectedFile(null)
        setSelectedType("")
        onDocumentChange()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload document")
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentType: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents?type=${documentType}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Document deleted successfully from cloud storage",
        })
        onDocumentChange()
      } else {
        throw new Error("Failed to delete document")
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const getDocumentByType = (type: string) => {
    return documents.find((doc) => doc.document_type === type)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isBlobUrl = (url: string) => {
    return url.startsWith('https://')
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Upload Document to Cloud Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file-input">PDF File (Max 10MB)</Label>
              <Input id="file-input" type="file" accept=".pdf" onChange={handleFileSelect} />
            </div>
          </div>
          <Button onClick={handleUpload} disabled={!selectedFile || !selectedType || uploading} className="w-full">
            {uploading ? "Uploading to Cloud..." : "Upload Document"}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Employee Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DOCUMENT_TYPES.map((type) => {
              const document = getDocumentByType(type.value)
              return (
                <div key={type.value} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {document && isBlobUrl(document.file_path) && (
                        <Cloud className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      {document ? (
                        <p className="text-sm text-muted-foreground">
                          {document.file_name} • {formatFileSize(document.file_size)} •
                          {new Date(document.uploaded_at).toLocaleDateString()}
                          {isBlobUrl(document.file_path) && (
                            <span className="ml-2 text-blue-600 text-xs">☁️ Cloud</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No document uploaded</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {document ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(document.file_path, "_blank")}
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(document.document_type)}
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not uploaded</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
