import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Sparkles,
  Share2,
  Lock,
  Globe,
  Link as LinkIcon,
  Zap,
  Database,
  Palette,
  CheckCircle2,
  ArrowRight,
  Code2,
  FileText,
  Copy,
  Terminal,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                Internet Notebook
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#sharing" className="hover:text-foreground transition-colors">
              Sharing Modes
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="font-medium text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" variant="glow" className="font-semibold text-xs gap-1.5 shadow-sm">
                <span>Open Notebook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-purple-500/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Personal-First Knowledge & Instant Link Sharing</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 max-w-4xl mx-auto">
            Your personal notebook on the{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              internet
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            A fast, distraction-free space for AI prompts, server commands, meeting decisions, and ideas.
            Write in rich typography, customize aesthetics, and share secret read-only links in seconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="glow" className="w-full sm:w-auto font-semibold gap-2 shadow-lg shadow-primary/20 text-sm h-12 px-6">
                <span>Start Writing for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium text-sm h-12 px-6 border-border/80">
                <span>Sign In to Existing Account</span>
              </Button>
            </Link>
          </div>

          {/* Interactive Document Preview Mockup */}
          <div className="relative mx-auto max-w-4xl rounded-3xl border border-border/80 bg-card/70 p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-border/50">
            <div className="rounded-2xl border border-border/60 bg-background/95 overflow-hidden shadow-inner">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="text-[11px] font-mono text-muted-foreground ml-2 hidden sm:inline">
                    internet-notebook.app/p/system-prompt-guide
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-[10px] py-0.5">
                    <Globe className="w-2.5 h-2.5 mr-1" /> Public Note
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0.5 font-mono">
                    Updated just now
                  </Badge>
                </div>
              </div>

              {/* Document Mock Content */}
              <div className="p-6 sm:p-10 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-2xl flex items-center justify-center">
                    🤖
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      Senior AI Architect & Coding Prompt
                    </h2>
                    <span className="text-xs text-muted-foreground font-mono">
                      Template: AI Prompt • Inter Typography • Warm Slate
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-foreground/90 font-sans">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 font-mono text-xs text-primary leading-relaxed">
                    <code>// Role Objective: Build resilient fullstack web architecture with PostgreSQL & Next.js</code>
                  </div>

                  <p className="leading-relaxed">
                    You are a world-class principal software engineer. Always focus on clean abstractions, typed database schemas with Drizzle ORM, and high-performance server components.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card/60">
                      <div className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Key Philosophy
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Keep visibility simple: Private, Secret Link, or Public URL. No permission chaos.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border/70 bg-card/60">
                      <div className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-500" />
                        Instant Sharing
                      </div>
                      <p className="text-xs text-muted-foreground">
                        One click to copy link &rarr; WhatsApp &rarr; colleague views instantly without account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Bento Grid */}
      <section id="features" className="py-20 border-t border-border/40 bg-muted/20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3">
              Designed For Focus
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Most note apps are bloated with enterprise hierarchies, slow sync engines, and paywalls.
              Internet Notebook is stripped down to pure speed and aesthetics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Quick Capture with <kbd className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Ctrl+K</kbd>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Capture thoughts instantly without friction. Press shortcut from anywhere to store a snippet, command, or meeting note immediately.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <span>Instant Autosave</span>
                <span className="text-emerald-500 font-bold">• Active</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Zero-Friction Sharing
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate unlisted read-only links with non-guessable tokens. Send to clients or friends on WhatsApp — they read immediately with no signup needed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <span>1-Click Revocation</span>
                <span className="text-blue-500 font-bold">• Instant</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Curated Typography & Mood
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Switch between Inter, Geist, DM Sans, Manrope, or Editorial Serif fonts. Tailored light and dark themes with paper textures and subtle accents.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <span>6 Font Styles & 6 Backgrounds</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Modern Tiptap Document Engine
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rich formatting with headings, code blocks, task checklists, blockquotes, highlights, and divider lines. Document-first mental model.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Structured JSON content model</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Bring Any PostgreSQL
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Works seamlessly with Neon DB, Supabase Postgres, Railway, AWS RDS, or self-hosted Docker. You own your database URL completely.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Drizzle ORM + Node-Postgres</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm interactive-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  Ready-to-Use Templates
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start with structured blueprints for AI prompts, server runbooks, sprint deliverables, task checklists, and design decisions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>6 Instant Presets Included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Visibility Modes Section */}
      <section id="sharing" className="py-20 border-t border-border/40 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3">
              Simple Access Model
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
              Three clear visibility levels
            </h2>
            <p className="text-sm text-muted-foreground">
              No complex permissions or user roles. Choose exactly how each page is accessed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border/80 bg-card/60 flex flex-col items-start text-left">
              <div className="p-2.5 rounded-xl bg-slate-500/10 text-foreground mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold mb-1.5">🔒 Private Mode</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Encrypted and visible only to you. Perfect for personal journals, sensitive credentials, and raw scratchpads.
              </p>
              <div className="mt-auto w-full p-2.5 rounded-lg bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/40">
                /page/[id] (Auth required)
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 flex flex-col items-start text-left relative overflow-hidden">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold mb-1.5 text-foreground">🔗 Unlisted / Share Link</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Anyone with the secret 16-character token can view read-only. No password or login required. Easy to revoke anytime.
              </p>
              <div className="mt-auto w-full p-2.5 rounded-lg bg-amber-500/10 text-[11px] font-mono text-amber-700 dark:text-amber-300 border border-amber-500/20">
                /s/[secret-token]
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 flex flex-col items-start text-left relative overflow-hidden">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold mb-1.5 text-foreground">🌍 Public Web Page</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Indexed, beautiful public URL for documentation, portfolio notes, shared guides, and blog-like essays.
              </p>
              <div className="mt-auto w-full p-2.5 rounded-lg bg-emerald-500/10 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                /p/[custom-slug]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="py-20 border-t border-border/40 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Start building your internet notebook today.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Create pages, format prompts, organize server notes, and share them instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg" variant="glow" className="font-semibold text-sm h-12 px-8 shadow-xl shadow-primary/20">
                Create Account Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-background text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Internet Notebook</span>
            <span>— Personal Knowledge System</span>
          </div>
          <div className="flex items-center gap-6">
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