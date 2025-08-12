"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StickyNote, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Note {
  id: number
  employee_id: number
  note: string
  created_by: string
  created_at: string
}

interface EmployeeNotesProps {
  employeeId: number
  notes: Note[]
  onNotesChange: () => void
}

export function EmployeeNotes({ employeeId, notes, onNotesChange }: EmployeeNotesProps) {
  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Empty note",
        description: "Please enter a note before saving",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: newNote.trim(),
          createdBy: "Admin", // TODO: Get from session
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Note added successfully",
        })
        setNewNote("")
        onNotesChange()
      } else {
        throw new Error("Failed to add note")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Employee Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-2">
          <Label htmlFor="new-note">Add Note</Label>
          <Textarea
            id="new-note"
            placeholder="Enter a note about this employee..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={saving || !newNote.trim()} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Adding..." : "Add Note"}
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No notes added yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm mb-2">{note.note}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>By: {note.created_by}</span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
