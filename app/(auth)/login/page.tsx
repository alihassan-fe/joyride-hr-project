"use client"

import { type FormEvent, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const search = useSearchParams()
  const router = useRouter()
  const callbackUrl = search.get("callbackUrl") || "/dashboard/applicants"

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (res?.error) {
      setError("Invalid credentials")
      return
    }
    router.push(callbackUrl)
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex items-center gap-3">
          <img src="/placeholder-logo.svg" alt="Logo" className="h-8 w-auto" />
          <CardTitle className="text-xl">Sign in to Joyride HR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-center gap-2 bg-transparent"
              onClick={() => signIn("google", { callbackUrl })}
            >
              <img src="/google.svg" alt="Google" className="h-4 w-4" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-2 bg-transparent"
              onClick={() => signIn("azure-ad", { callbackUrl })}
            >
              <img src="/microsoft.png" alt="Microsoft" className="h-4 w-4" />
              Continue with Microsoft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
