"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Cloud, Database, HardDrive, RefreshCw, Upload, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MigrationStatus {
  totalDocuments: number
  localFiles: number
  blobFiles: number
  mixedFiles: number
}

interface MigrationResult {
  success: boolean
  message: string
  migratedCount?: number
  errors?: string[]
}

export default function MigrateFilesPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const { toast } = useToast()

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/migrate-files")
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
      } else {
        throw new Error("Failed to fetch migration status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch migration status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const response = await fetch("/api/admin/migrate-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "migrate" }),
      })

      const result: MigrationResult = await response.json()

      if (result.success) {
        toast({
          title: "Migration Successful",
          description: result.message,
        })
        fetchStatus()
      } else {
        toast({
          title: "Migration Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start migration",
        variant: "destructive",
      })
    } finally {
      setMigrating(false)
    }
  }

  const handleCleanup = async () => {
    setCleaning(true)
    try {
      const response = await fetch("/api/admin/migrate-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup" }),
      })

      const result: MigrationResult = await response.json()

      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: result.message,
        })
        fetchStatus()
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start cleanup",
        variant: "destructive",
      })
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (!status && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading migration status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Migration Manager</h1>
          <p className="text-muted-foreground">
            Migrate files from local storage to Vercel Blob Storage
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">All documents in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Local Files</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{status.localFiles}</div>
              <p className="text-xs text-muted-foreground">Stored on server</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cloud Files</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{status.blobFiles}</div>
              <p className="text-xs text-muted-foreground">In Vercel Blob</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mixed Files</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{status.mixedFiles}</div>
              <p className="text-xs text-muted-foreground">Other storage types</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Migration Progress */}
      {status && status.localFiles > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Local Files Detected</AlertTitle>
              <AlertDescription>
                You have {status.localFiles} files stored locally that need to be migrated to cloud storage.
                This will improve performance and reliability.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleMigrate} 
                disabled={migrating}
                className="bg-green-600 hover:bg-green-700"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Migrate to Cloud
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Section */}
      {status && status.blobFiles > 0 && status.localFiles === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Local Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                All files have been successfully migrated to cloud storage. 
                You can now safely clean up local files to free up server space.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleCleanup} 
                disabled={cleaning}
                variant="outline"
              >
                {cleaning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Local Files
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {status && status.totalDocuments > 0 && status.localFiles === 0 && status.mixedFiles === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Migration Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              All {status.totalDocuments} documents have been successfully migrated to Vercel Blob Storage.
              Your file system is now fully cloud-based and optimized for performance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
