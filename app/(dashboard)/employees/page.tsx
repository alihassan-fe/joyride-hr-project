"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Employee } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react'

export default function EmployeesPage() {
  const [q, setQ] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/employees")
    const j = await res.json()
    setEmployees(j.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return employees.filter(e => `${e.name} ${e.email} ${e.role}`.toLowerCase().includes(s))
  }, [employees, q])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-neutral-500">Directory with search</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input placeholder="Search employees..." className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!loading && filtered.map((e) => (
          <Card key={e.id} className="hover:shadow-sm transition">
            <CardHeader className="flex flex-row items-center gap-3">
              <Avatar>
                <AvatarFallback>{(e.name || "?").split(" ").map((n) => n[0]).join("").slice(0,2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{e.name}</CardTitle>
                <p className="text-xs text-neutral-500">{e.email}</p>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Role</span>
                <Badge variant="secondary" className="bg-neutral-100 text-neutral-800">{e.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Start</span>
                <span>{new Date(e.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">PTO</span>
                <span>{e.pto_balance} days</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-40 bg-neutral-50 border-neutral-100" />
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-neutral-500">No employees found.</p>
        )}
      </div>
    </div>
  )
}
