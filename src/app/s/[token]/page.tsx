import { notFound } from 'next/navigation'
import { getPageByShareToken } from '@/lib/pages-api'
import Link from 'next/link'
import {
  BookOpen,
  Link as LinkIcon,
  Clock,
  Sparkles,
  Share2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const page = await getPageByShareToken(token)
  if (!page) return { title: 'Shared Link Expired or Not Found — Internet Notebook' }
  return {
    title: `${page.title} — Shared on Internet Notebook`,
    description: `Read-only document shared with you on Internet Notebook`,
  }
}

export default async function SharedPage({ params }: Props) {
  const { token } = await params
  const page = await getPageByShareToken(token)

  if (!page) {
    notFound()
  }

  const fontClass = page.font ? `font-${page.font}` : 'font-inter'
  const bgClass = page.background ? `bg-page-${page.background}` : 'bg-page-default'

  // Estimate reading stats
  const plainText = page.content ? page.content.replace(/<[^>]*>/g, ' ').trim() : ''
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div
      className={`min-h-screen ${fontClass} ${bgClass} flex flex-col transition-colors duration-300 selection:bg-primary/20 selection:text-primary`}
    >
      {/* Top Banner Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-6 h-15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                Internet Notebook
              </span>
              <Badge variant="warning" className="text-[10px] py-0 hidden sm:inline-flex">
                <LinkIcon className="w-2.5 h-2.5 mr-1" /> Shared Link (Read-Only)
              </Badge>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/auth/signup">
              <Button size="sm" variant="glow" className="text-xs font-semibold gap-1.5 shadow-sm">
                <span>Open Your Notebook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-16">
        <article className="space-y-6">
          {/* Icon & Meta Header */}
          <div className="space-y-4">
            {page.icon && (
              <div className="text-4xl sm:text-5xl select-none w-16 h-16 rounded-2xl bg-card/60 flex items-center justify-center border border-border/40 shadow-xs">
                {page.icon}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {page.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 pb-6 border-b border-border/60 font-medium">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Shared with you via secret link</span>
              </div>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Rendered Rich Content */}
          <div
            className="ProseMirror prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed text-base font-sans"
            dangerouslySetInnerHTML={{
              __html:
                page.content ||
                '<p class="text-muted-foreground italic">No content on this page.</p>',
            }}
          />
        </article>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-border/40 py-10 mt-20 bg-background/60 backdrop-blur-sm text-center text-xs text-muted-foreground">
        <div className="max-w-3xl mx-auto px-6 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Internet Notebook</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A personal-first knowledge and document system. Write anything, make it beautiful, share it instantly.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Create your own notebook for free</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
