"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  function toggleTheme() {
    // Use resolvedTheme to avoid "system" ambiguity
    const next = resolvedTheme === "dark" || theme === "dark" ? "light" : "dark"
    setTheme(next)
  }

  // Avoid mismatches during SSR
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" title="Toggle theme" className="rounded-full">
        <Sun className="size-5" />
      </Button>
    )
  }

  const isDark = (resolvedTheme ?? theme) === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="rounded-full"
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
