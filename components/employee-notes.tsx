"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StickyNote, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Note } from "@/lib/types"

interface EmployeeNotesProps {
  employeeId: string
  notes: Note[]
  onNotesChange: () => void
}

export function EmployeeNotes({ employeeId, notes, onNotesChange }: EmployeeNotesProps) {
  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  console.log("notes", notes)
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
          note_text: newNote.trim(), // Assuming note_text is the same as note
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
          <h3 className="font-medium">Previous Notes</h3>
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-3 border rounded-lg">
                <p className="text-sm">
                  {note.note_text || note.note || "No content"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.created_at).toLocaleDateString()}
                  {note.created_by && ` • by ${note.created_by}`}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
