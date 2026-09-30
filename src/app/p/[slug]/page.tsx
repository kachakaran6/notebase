import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/pages-api'
import Link from 'next/link'
import {
  NotebookPen,
  Globe,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return { title: 'Page Not Found — Pages' }
  return {
    title: `${page.title} — Pages`,
    description: `Published document on Pages`,
  }
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)

  if (!page) {
    notFound()
  }

  const fontClass = page.font ? `font-${page.font}` : 'font-inter'
  const bgClass = page.background ? `bg-page-${page.background}` : 'bg-page-default'

  // Estimate reading time
  const plainText = page.content ? page.content.replace(/<[^>]*>/g, ' ').trim() : ''
  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div
      className={`min-h-screen ${fontClass} ${bgClass} flex flex-col font-inter transition-colors`}
    >
      {/* Top Banner Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-[840px] mx-auto px-6 h-12 flex items-center justify-between">
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
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-[760px] w-full mx-auto px-6 py-12 md:py-16">
        <article className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight">
              {page.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4 border-b border-border">
              <Clock className="w-3.5 h-3.5 text-subtle-foreground" />
              <span>
                {new Date(page.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
            </div>
          </div>

          {/* Rendered Content */}
          <div
            className="ProseMirror text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html:
                page.content ||
                '<p class="text-muted-foreground">No content on this page.</p>',
            }}
          />
        </article>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-[760px] mx-auto px-6 flex items-center justify-between">
          <span>Published with Pages</span>
          <Link href="/auth/signup" className="text-primary hover:underline font-medium">
            Create your notebook
          </Link>
        </div>
      </footer>
    </div>
  )
}
