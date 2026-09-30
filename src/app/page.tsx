import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  NotebookPen,
  Lock,
  Globe,
  Link as LinkIcon,
  Zap,
  Database,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Terminal,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-inter selection:bg-primary/20 selection:text-primary">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <div className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center border border-border">
              <NotebookPen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Pages
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#sharing" className="hover:text-foreground transition-colors">
              Sharing Model
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs font-normal">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="text-xs font-medium">
                <span>Open Notebook</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.15] mb-6">
            A personal notebook for your notes, prompts, and ideas.
          </h1>

          <p className="text-sm sm:text-base text-secondary-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            A fast, distraction-free document application. Write in rich text, organize your thoughts, and share secret read-only links in seconds with zero friction.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-xs font-medium px-5">
                <span>Start Writing</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-xs font-normal px-5">
                <span>Sign in to account</span>
              </Button>
            </Link>
          </div>

          {/* Clean Editorial Document Mockup */}
          <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card shadow-xs text-left overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-surface-secondary flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-[11px]">notes/system-prompts.md</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Globe className="w-3 h-3 text-muted-foreground" />
                <span>Public</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                System Prompt & Engineering Runbook
              </h2>

              <p className="text-xs sm:text-sm text-secondary-foreground leading-relaxed">
                Guidelines for designing robust fullstack systems with PostgreSQL, Drizzle ORM, and Next.js.
              </p>

              <div className="p-3 rounded-md bg-surface-secondary border border-border font-mono text-xs text-foreground leading-relaxed">
                <code>DATABASE_URL=postgresql://user:pass@host/db?sslmode=require</code>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg border border-border bg-background">
                  <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                    Private First
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only you can view and edit private notes by default.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-background">
                  <div className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-muted-foreground" />
                    Secret Share Link
                  </div>
                  <p className="text-xs text-muted-foreground">
                    One click to copy a read-only link for WhatsApp or team chats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-b border-border bg-surface-secondary">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-2">
              Designed for daily focus
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A personal-first knowledge tool built around speed, clean typography, and your own database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-md bg-surface-secondary flex items-center justify-center border border-border mb-3 text-foreground">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Quick Capture
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Press ⌘K or Ctrl+K from anywhere to capture commands, ideas, and meeting takeaways instantly.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-md bg-surface-secondary flex items-center justify-center border border-border mb-3 text-foreground">
                <LinkIcon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Unlisted Sharing
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate 16-character unlisted links. Send on WhatsApp — recipients read immediately with no account required.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-md bg-surface-secondary flex items-center justify-center border border-border mb-3 text-foreground">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                PostgreSQL Backed
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect any PostgreSQL database — Neon DB, Supabase, AWS RDS, or local Docker. You own your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Models */}
      <section id="sharing" className="py-20 border-b border-border bg-background">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-2">
              Three clean visibility modes
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No complex permissions or user roles. Choose exactly how each page is accessed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Private</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Encrypted and visible only to you. Ideal for server commands, personal notes, and scratchpads.
              </p>
              <div className="text-[11px] font-mono text-subtle-foreground bg-surface-secondary p-2 rounded border border-border">
                /page/[id]
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Shared (Unlisted)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Anyone with the secret URL can view read-only. No password or account required.
              </p>
              <div className="text-[11px] font-mono text-subtle-foreground bg-surface-secondary p-2 rounded border border-border">
                /s/[secret-token]
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Public Web Page</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Publicly accessible URL for documentation, guides, and published writing.
              </p>
              <div className="text-[11px] font-mono text-subtle-foreground bg-surface-secondary p-2 rounded border border-border">
                /p/[custom-slug]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border text-xs text-muted-foreground">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <NotebookPen className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold">Pages</span>
            <span className="text-muted-foreground font-normal">— Personal Knowledge System</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup" className="hover:text-foreground transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}