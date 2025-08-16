"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"
import { FileUp, Plus } from 'lucide-react'

type Props = {
  onAdded?: () => void
}

export function ManualUpload({ onAdded = () => {} }: Props) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [department, setDepartment] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN}/webhook/manual-cv-upload`
  const departmentOptions = ["Operations", "Maintenance", "Safety", "Billing Payroll"]

async function handleUpload() {
  if (!file) return;
  
  setUploading(true);

  const form = new FormData();
  form.append("file", file);
  if (department.trim()) {
      form.append("department", department.trim())
    }

  try {
    const res = await fetch(
      WEBHOOK_URL,
      {
        method: "POST",
        body: form,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      alert(`Upload failed: ${err}`);
      setUploading(false);
      return;
    }

    // n8n can return success JSON or text
    const result = await res.json().catch(() => ({}));
    console.log("n8n response", result);

    setOpen(false);
      setFile(null)
      setDepartment("")
    onAdded(); // refresh UI
  } catch (error) {
    console.error(error);
    alert("Something went wrong while uploading");
  } finally {
    setUploading(false);
  }
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual CV Upload</DialogTitle>
          <DialogDescription>Upload a PDF resume. The backend will parse it and create a candidate.</DialogDescription>
        </DialogHeader>
            <div className="space-y-4">
          <div className="space-y-1">
            <Label>CV (PDF)</Label>
            <Input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
              <div className="space-y-1">
            <Label>Department</Label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          </div>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            <FileUp className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload and Parse"}
          </Button>
      </DialogContent>
    </Dialog>
  )
}
