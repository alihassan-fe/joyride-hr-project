"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Megaphone, RefreshCw } from "lucide-react"

type Broadcast = {
  id: number
  title: string
  message: string
  created_by: string | null
  created_at: string
}

export default function BroadcastsPage() {
  const [items, setItems] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/broadcasts", { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Failed to load (${res.status})`)
      }
      const data: Broadcast[] = await res.json()
      setItems(data)
    } catch (e: any) {
      setError(e.message || "Failed to load broadcasts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setSuccess(null)
    if (!title.trim() || !message.trim()) {
      setCreateError("Title and message are required.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        if (res.status === 403) throw new Error("Only Admins can create broadcasts.")
        throw new Error(j.error || `Failed to create (${res.status})`)
      }
      setTitle("")
      setMessage("")
      setSuccess("Broadcast sent")
      await load()
    } catch (e: any) {
      setCreateError(e.message || "Failed to create broadcast")
    } finally {
      setCreating(false)
    }
  }

  const count = useMemo(() => items.length, [items])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Broadcasts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{count} total</Badge>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw
              className="h-4 w-4 mr-2 animate-spin"
              style={{ animationPlayState: loading ? "running" : "paused" }}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <Card className="rounded-2xl shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Failed to load</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse bg-neutral-50" />
                ))}
              {!loading && items.length === 0 && (
                <div className="text-sm text-muted-foreground">No broadcasts yet.</div>
              )}
              {!loading &&
                items.map((b) => (
                  <div key={b.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{b.message}</div>
                    <div className="text-xs text-muted-foreground mt-2">From: {b.created_by || "System"}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Send Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            {createError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Couldn{"'"}t send</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreate} className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Company Update"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Share important announcements with everyone..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
