import { notFound } from 'next/navigation'
import { getPageByShareToken } from '@/lib/pages-api'
import Link from 'next/link'
import {
  NotebookPen,
  Link as LinkIcon,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/theme-toggle'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const page = await getPageByShareToken(token)
  if (!page) return { title: 'Shared Link Expired — Pages' }
  return {
    title: `${page.title} — Shared on Pages`,
    description: `Read-only document shared on Pages`,
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
      className={`min-h-screen ${fontClass} ${bgClass} flex flex-col font-inter transition-colors`}
    >
      {/* Top Banner Header (Edge-to-edge) */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-85 transition">
            <div className="w-6 h-6 rounded-md bg-secondary text-foreground flex items-center justify-center border border-border">
              <NotebookPen className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-xs tracking-tight">
              Pages
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mr-2">
              <LinkIcon className="w-3 h-3" />
              <span>Shared (Read-Only)</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
              {page.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4 border-b border-border">
              <Clock className="w-3.5 h-3.5 text-subtle-foreground" />
              <span>Shared via secret link</span>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
            </div>
          </div>

          {/* Rendered Content */}
          <div
            className="ProseMirror text-foreground leading-relaxed text-sm sm:text-base"
            dangerouslySetInnerHTML={{
              __html:
                page.content ||
                '<p class="text-muted-foreground">No content on this page.</p>',
            }}
          />
        </article>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-border py-6 text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>Shared with Pages</span>
          <Link href="/auth/signup" className="text-primary hover:underline font-medium">
            Create your notebook
          </Link>
        </div>
      </footer>
    </div>
  )
}
