"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<null | "credentials" | "google" | "azure-ad">(null)
  const [error, setError] = useState<string>("")
  const searchParams = useSearchParams()
  const err = searchParams.get("error")

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading("credentials")
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/applicants",
      redirect: false,
    })
    setLoading(null)
    if (res?.ok) {
      window.location.href = res.url || "/applicants"
    } else {
      setError("Invalid email or password")
    }
  }

  async function doSSO(provider: "google" | "azure-ad") {
    setError("")
    setLoading(provider)
    await signIn(provider, { callbackUrl: "/applicants" })
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md border-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Use your email/password</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Manual login */}
          <form className="grid gap-3" onSubmit={handleCredentials}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
            <Button type="submit" disabled={loading !== null}>
              <LogIn className="h-4 w-4 mr-2" />
              {loading === "credentials" ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-xs text-neutral-500">or</span>
          </div>

          {/* SSO buttons */}
          <div className="grid gap-2">
            <Button variant="outline" className="w-full" onClick={() => doSSO("google")} disabled={loading !== null}>
              <img src="/google.svg" alt="" className="h-4 w-4 mr-2" />
              {loading === "google" ? "Redirecting..." : "Continue with Google"}
            </Button>
            {/* <Button variant="outline" className="w-full" onClick={() => doSSO("azure-ad")} disabled={loading !== null}>
              <img src="/placeholder.svg?height=20&width=20" alt="" className="h-4 w-4 mr-2" />
              {loading === "azure-ad" ? "Redirecting..." : "Continue with Microsoft"}
            </Button> */}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
