"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { LogIn } from 'lucide-react'
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function doSignIn(provider: "google" | "azure-ad") {
    setLoading(provider)
    await signIn(provider, { callbackUrl: "/applicants" })
    setLoading(null)
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-neutral-50">
      <Card className="w-full max-w-md border-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Use your Google or Microsoft account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            variant="outline"
            onClick={() => doSignIn("google")}
            disabled={loading !== null}
          >
            <img src="/placeholder.svg?height=20&width=20" alt="" className="h-4 w-4 mr-2" />
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </Button>
          <Button
            variant="outline"
            onClick={() => doSignIn("azure-ad")}
            disabled={loading !== null}
          >
            <img src="/placeholder.svg?height=20&width=20" alt="" className="h-4 w-4 mr-2" />
            {loading === "azure-ad" ? "Redirecting..." : "Continue with Microsoft"}
          </Button>
          <p className="text-xs text-neutral-500">
            Enterprise SSO available via Microsoft Entra (Azure AD).
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
