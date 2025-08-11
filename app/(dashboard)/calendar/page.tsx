"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarBoard } from "@/components/calendar-board"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function CalendarPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ employee_id: "", employee_name: "", start_date: "", end_date: "", reason: "" })

  const statusBadge = useMemo(
    () => ({
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
    }),
    [],
  )

  return (
    <div className="w-full">
          <CalendarBoard />
        </div>
  )
}
