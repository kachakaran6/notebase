"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border/40 bg-card/60 text-muted-foreground transition-colors ${className}`}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </button>
    )
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`relative inline-flex items-center justify-center gap-2 h-9 px-2.5 rounded-xl border border-border/50 bg-background/80 hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground backdrop-blur-md transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      title={`Current: ${theme || "system"} (Click to cycle Light / Dark / System)`}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      </div>
      {showLabel && (
        <span className="text-xs font-medium capitalize select-none">
          {theme === "system" ? "System" : theme}
        </span>
      )}
    </button>
  )
}
