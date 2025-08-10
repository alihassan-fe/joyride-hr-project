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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN}/webhook/manual-cv-upload`

async function handleUpload() {
  if (!file) return;
  setUploading(true);

  const form = new FormData();
  form.append("file", file);

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
    setFile(null);
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
          <div className="space-y-1">
            <Label>CV (PDF)</Label>
            <Input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            <FileUp className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload and Parse"}
          </Button>
      </DialogContent>
    </Dialog>
  )
}
