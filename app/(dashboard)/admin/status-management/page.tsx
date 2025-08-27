"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { StatusManagement } from "@/components/status-management"
import { CandidateStatusOption } from "@/lib/types"

export default function AdminStatusManagementPage() {
  const [statuses, setStatuses] = useState<CandidateStatusOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  async function fetchStatuses() {
    try {
      setLoading(true)
      const res = await fetch("/api/candidate-statuses")
      const data = await res.json()
      setStatuses(data ?? [])
    } catch (error) {
      setError("Failed to fetch statuses")
      console.error("Error fetching statuses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatuses()
  }, [])

  async function handleAddStatus(name: string, color: string) {
    try {
      const res = await fetch("/api/candidate-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      if (!res.ok) {
        throw new Error("Failed to add status")
      }
      await fetchStatuses()
    } catch (error) {
      console.error("Error adding status:", error)
      throw error
    }
  }

  async function handleUpdateStatus(id: number, name: string, color: string) {
    try {
      const res = await fetch(`/api/candidate-statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      })
      if (!res.ok) {
        throw new Error("Failed to update status")
      }
      await fetchStatuses()
    } catch (error) {
      console.error("Error updating status:", error)
      throw error
    }
  }

  async function handleDeleteStatus(id: number) {
    try {
      const res = await fetch(`/api/candidate-statuses/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete status")
      }
      await fetchStatuses()
    } catch (error) {
      console.error("Error deleting status:", error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Status Management</h1>
          <p className="text-sm text-neutral-500">Manage candidate application statuses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStatuses} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-700">Failed to load statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Statuses</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusManagement
            statuses={statuses}
            onAddStatus={handleAddStatus}
            onUpdateStatus={handleUpdateStatus}
            onDeleteStatus={handleDeleteStatus}
          />
        </CardContent>
      </Card>
    </div>
  )
}
