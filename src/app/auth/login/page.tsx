"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandLogo } from '@/components/brand-logo'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in')
      }

      toast.success('Signed in successfully')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-inter selection:bg-primary/20 selection:text-primary">
      {/* Top Bar */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 min-w-0">
        <div className="w-full max-w-sm">
          <div className="border border-border bg-card p-5 sm:p-7 rounded-xl shadow-xs space-y-4 sm:space-y-5 min-w-0">
            {/* Header */}
            <div className="space-y-1.5 text-left">
              <div className="mb-3 inline-block">
                <BrandLogo size={32} />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Sign in to Notebase
              </h1>
              <p className="text-xs text-muted-foreground">
                Enter your email and password to access your notebook.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-normal">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-foreground block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-8 h-9 text-xs"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-foreground block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-8 pr-8 h-9 text-xs"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle-foreground hover:text-foreground cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-9 text-xs font-medium mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>

            {/* Bottom Switcher */}
            <div className="pt-3 border-t border-border/60 text-center text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-foreground hover:underline font-medium"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-subtle-foreground">
        Notebase • Personal Knowledge System
      </footer>
    </div>
  )
}
