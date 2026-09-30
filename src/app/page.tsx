import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  Globe,
  Link as LinkIcon,
  Database,
  FileText,
  Clock,
  ArrowRight,
  Search,
  Plus,
  NotebookPen,
} from 'lucide-react'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandLogo } from '@/components/brand-logo'
import { PwaStandaloneRedirect } from '@/components/pwa-standalone-redirect'

export const metadata: Metadata = {
  title: 'Notebase — Your notes. Your ideas. One place.',
  description:
    'A simple place for your notes, prompts, ideas and pages. Keep them private or share them when you need to.',
  openGraph: {
    title: 'Notebase — Your notes. Your ideas. One place.',
    description:
      'A simple place for your notes, prompts, ideas and pages. Keep them private or share them when you need to.',
    siteName: 'Notebase',
    images: [
      {
        url: '/notebase.png',
        width: 512,
        height: 512,
        alt: 'Notebase',
      },
    ],
  },
}

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-inter selection:bg-primary/20 selection:text-primary">
      <PwaStandaloneRedirect />

      {/* Clean Minimal Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-90 transition shrink-0"
          >
            <BrandLogo size={24} />
            <span className="font-semibold text-sm tracking-tight">Notebase</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-normal h-8 px-2.5 sm:px-3 text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="text-xs font-medium h-8 px-3">
                Open Notebase
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col justify-between">
        {/* Hero Section */}
        <section className="pt-14 pb-8 sm:pt-20 sm:pb-12 md:pt-28 md:pb-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center min-w-0">
            {/* Bold, Clean Charcoal Heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-foreground leading-[1.08] mb-5 sm:mb-6">
              Your notes.
              <br />
              Your ideas.
              <br />
              One place.
            </h1>

            {/* Human, Calm Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-secondary-foreground max-w-[580px] mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
              Write anything. Keep it private or share it when you need to.
            </p>

            {/* Primary Action */}
            <div className="flex flex-col items-center justify-center gap-3">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="h-11 sm:h-12 px-7 sm:px-8 text-sm font-medium gap-2 shadow-xs hover:opacity-95 transition-all cursor-pointer"
                >
                  <span>Open Notebase</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-subtle-foreground font-normal">
                No clutter. No complicated workspace.
              </p>
            </div>
          </div>

          {/* Realistic Product Preview */}
          <div className="w-full max-w-5xl mx-auto mt-12 sm:mt-16 md:mt-20 min-w-0">
            <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0">
              {/* Preview Window Header */}
              <div className="h-11 sm:h-12 px-3 sm:px-4 border-b border-border bg-surface-secondary flex items-center justify-between gap-3 text-xs min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <BrandLogo size={18} />
                  <span className="font-semibold text-xs text-foreground hidden xs:inline">
                    Notebase
                  </span>
                </div>

                {/* Mockup Search */}
                <div className="flex-1 max-w-sm mx-auto hidden sm:flex items-center justify-between h-7 px-2.5 rounded-md border border-border bg-background text-xs text-muted-foreground min-w-0">
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <Search className="w-3.5 h-3.5 text-subtle-foreground shrink-0" />
                    <span className="text-[11px] truncate">Search pages...</span>
                  </div>
                  <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border text-subtle-foreground shrink-0">
                    ⌘K
                  </kbd>
                </div>

                {/* Mockup Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted-foreground border border-border bg-background">
                    <NotebookPen className="w-3 h-3 text-primary" />
                    <span>Quick Note</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-primary text-primary-foreground">
                    <Plus className="w-3 h-3" />
                    <span>New Page</span>
                  </div>
                </div>
              </div>

              {/* Preview Content Area */}
              <div className="p-4 sm:p-6 md:p-8 bg-background min-w-0">
                <div className="mb-4 sm:mb-6">
                  <div className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                    Pages
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Create, organize and share your notes, prompts and ideas.
                  </div>
                </div>

                {/* Filter Tabs Mockup */}
                <div className="flex items-center gap-4 text-xs font-medium border-b border-border pb-2 mb-4 sm:mb-5">
                  <span className="text-foreground font-semibold border-b-2 border-primary pb-2 -mb-[9px]">
                    All
                  </span>
                  <span className="text-muted-foreground">Private</span>
                  <span className="text-muted-foreground">Shared</span>
                  <span className="text-muted-foreground">Public</span>
                </div>

                {/* Realistic Document Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
                  {/* Card 1 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          AI System Prompts & Guidelines
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Standard personas, structured reasoning patterns, and system guidelines for local models.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>2h ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-subtle-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          Server Deployment Runbook
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Docker commands, environment variables, TLS renewal, and rollback procedures.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>Yesterday</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <LinkIcon className="w-3 h-3" />
                        <span>Shared</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          Product Roadmap & Architecture
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Core milestones, database schema definitions, and offline-first editor design.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>3d ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-subtle-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          Meeting Takeaways: Launch Sync
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Action items from sprint review, release checklist, and stakeholder sign-off.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>4d ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          PostgreSQL Migration Checklist
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Step-by-step schema verification, column index updates, and test data seeding.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>1w ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-subtle-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 6 */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col justify-between shadow-2xs min-w-0">
                    <div className="space-y-1.5 min-w-0 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <h3 className="text-xs font-semibold text-foreground truncate">
                          Ideas & Quick Scratchpad
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        Draft thoughts on minimal UI, typography experiments, and keyboard shortcuts.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-subtle-foreground" />
                        <span>Just now</span>
                      </div>
                      <div className="flex items-center gap-1 text-subtle-foreground">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Small Feature Strip */}
        <section className="py-12 sm:py-16 border-t border-border mt-10 sm:mt-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Private by default</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep your personal notes and ideas private to your account.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <LinkIcon className="w-3.5 h-3.5 text-primary" />
                <span>Share instantly</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate a secret read-only link for WhatsApp, teammates, or friends.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>Your data</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clean document storage backed by your own PostgreSQL database.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-border bg-card text-xs text-muted-foreground px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-foreground">
            <BrandLogo size={18} />
            <span className="font-semibold text-xs">Notebase</span>
            <span className="text-subtle-foreground font-normal">• Personal Knowledge System</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}