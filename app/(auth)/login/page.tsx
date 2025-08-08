"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Building2, LogIn, ShieldCheck } from 'lucide-react'

const demoUsers = [
  { email: "admin@acme.hr", role: "Admin" },
  { email: "manager@acme.hr", role: "HR Manager" },
  { email: "recruiter@acme.hr", role: "Recruiter" },
  { email: "viewer@acme.hr", role: "Viewer" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@acme.hr")
  const [role, setRole] = useState<string>("Admin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Login failed")
      }
      router.push("/dashboard/applicants")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md border-neutral-200">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-500">
            <Building2 className="h-5 w-5" />
            <span>Acme HR</span>
          </div>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Role-based access for the HR MVP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="HR Manager">HR Manager</SelectItem>
                  <SelectItem value="Recruiter">Recruiter</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-xs text-neutral-500">or quick demo</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((u) => (
              <Button
                key={u.email}
                variant="outline"
                onClick={() => { setEmail(u.email); setRole(u.role) }}
                className="justify-start"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                <span className="truncate">{u.role}</span>
              </Button>
            ))}
          </div>

          <div className="grid gap-2">
            <Button variant="outline" className="w-full" onClick={() => alert("OAuth stub. We'll wire Google later.")}>
              <img src="/placeholder.svg?height=20&width=20" alt="" className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full" onClick={() => alert("OAuth stub. We'll wire Microsoft later.")}>
              <img src="/placeholder.svg?height=20&width=20" alt="" className="h-4 w-4 mr-2" />
              Continue with Microsoft
            </Button>
          </div>

          <p className="text-xs text-neutral-500">
            This is a demo login with mock roles. Replace with OAuth/JWT in production.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
