"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Lock } from "lucide-react"
import { CandidateStatusOption } from "@/lib/types"

interface Props {
  statuses: CandidateStatusOption[]
  onAddStatus: (name: string, color: string) => Promise<void>
  onUpdateStatus: (id: number, name: string, color: string) => Promise<void>
  onDeleteStatus: (id: number) => Promise<void>
}

export function StatusManagement({ statuses, onAddStatus, onUpdateStatus, onDeleteStatus }: Props) {
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editingStatus, setEditingStatus] = React.useState<CandidateStatusOption | null>(null)
  const [newStatusName, setNewStatusName] = React.useState("")
  const [newStatusColor, setNewStatusColor] = React.useState("#6B7280")
  const [editStatusName, setEditStatusName] = React.useState("")
  const [editStatusColor, setEditStatusColor] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return
    
    setIsLoading(true)
    try {
      await onAddStatus(newStatusName.trim(), newStatusColor)
      setNewStatusName("")
      setNewStatusColor("#6B7280")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Failed to add status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStatus = async () => {
    if (!editingStatus || !editStatusName.trim()) return
    
    setIsLoading(true)
    try {
      await onUpdateStatus(editingStatus.id, editStatusName.trim(), editStatusColor)
      setIsEditDialogOpen(false)
      setEditingStatus(null)
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (status: CandidateStatusOption) => {
    setEditingStatus(status)
    setEditStatusName(status.name)
    setEditStatusColor(status.color)
    setIsEditDialogOpen(true)
  }

  const handleDeleteStatus = async (status: CandidateStatusOption) => {
    if (status.is_default) {
      alert("Cannot delete default statuses")
      return
    }
    
    if (confirm(`Are you sure you want to delete the status "${status.name}"?`)) {
      try {
        await onDeleteStatus(status.id)
      } catch (error) {
        console.error("Failed to delete status:", error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status Management</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status-name">Status Name</Label>
                <Input
                  id="status-name"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Enter status name..."
                />
              </div>
              <div>
                <Label htmlFor="status-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="status-color"
                    type="color"
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    placeholder="#6B7280"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStatus} disabled={isLoading || !newStatusName.trim()}>
                  {isLoading ? "Adding..." : "Add Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {statuses.map((status) => (
          <Card key={status.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{status.name}</span>
                      {status.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Sort order: {status.sort_order}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(status)}
                    disabled={status.is_default}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStatus(status)}
                    disabled={status.is_default}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-status-name">Status Name</Label>
              <Input
                id="edit-status-name"
                value={editStatusName}
                onChange={(e) => setEditStatusName(e.target.value)}
                placeholder="Enter status name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-status-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-status-color"
                  type="color"
                  value={editStatusColor}
                  onChange={(e) => setEditStatusColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={editStatusColor}
                  onChange={(e) => setEditStatusColor(e.target.value)}
                  placeholder="#6B7280"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStatus} disabled={isLoading || !editStatusName.trim()}>
                {isLoading ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
