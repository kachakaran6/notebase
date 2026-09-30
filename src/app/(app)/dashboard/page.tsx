"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Lock,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  FolderPlus,
  LogOut,
  Clock,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  FileText,
  User,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { usePages } from '@/hooks/use-pages'
import { Page, Template, Visibility } from '@/types/page'
import { formatRelativeTime, stripHtml } from '@/lib/utils'
import { toast } from 'sonner'

const TEMPLATE_PRESETS: {
  id: Template
  label: string
  icon: string
  description: string
  title: string
  content: string
}[] = [
  {
    id: 'blank',
    label: 'Blank Page',
    icon: '📄',
    description: 'Clean slate for anything',
    title: 'Untitled Page',
    content: '<p></p>',
  },
  {
    id: 'notes',
    label: 'Meeting & Quick Notes',
    icon: '📝',
    description: 'Structure decisions & takeaways',
    title: 'Meeting Notes & Next Steps',
    content:
      '<h2>🎯 Meeting Objective</h2><p>Brief summary of why we gathered.</p><h2>💡 Key Takeaways</h2><ul><li>Point 1: Major architectural decision</li><li>Point 2: Timeline alignment</li></ul><h2>✅ Action Items</h2><ul><li>[ ] Follow up with team by Friday</li><li>[ ] Deploy initial preview link</li></ul>',
  },
  {
    id: 'checklist',
    label: 'Deployment & Checklist',
    icon: '☑️',
    description: 'Interactive task tracker',
    title: 'Production Deployment Checklist',
    content:
      '<h2>🚀 Pre-Flight Verification</h2><ul><li>[ ] Database migrations applied</li><li>[ ] Environment secrets configured</li><li>[ ] SSL certificates verified</li></ul><h2>🔍 Smoke Testing</h2><ul><li>[ ] Test authentication flow</li><li>[ ] Validate public share links</li><li>[ ] Verify dark mode contrast</li></ul>',
  },
  {
    id: 'prompt',
    label: 'AI System Prompt',
    icon: '🤖',
    description: 'Optimized persona & instructions',
    title: 'AI Architect System Prompt',
    content:
      '<h2>🧠 Persona & Context</h2><p>You are a Principal Software Architect specializing in modern fullstack TypeScript applications.</p><h2>🎯 Task Objectives</h2><p>Provide concise, production-ready code with clean typing and robust error handling.</p><h2>⚡ Constraints</h2><ul><li>Always prioritize speed and readability</li><li>Use pure SQL or typed ORM</li><li>Provide runnable solutions</li></ul>',
  },
  {
    id: 'project',
    label: 'Project Blueprint',
    icon: '🚀',
    description: 'Roadmap & deliverables',
    title: 'Product Roadmap & Deliverables',
    content:
      '<h2>📌 Vision</h2><p>Build a personal-first notebook system with instant secret link sharing.</p><h2>🗺 Milestones</h2><ul><li>Phase 1: Database Schema & Authentication</li><li>Phase 2: Rich Tiptap Editor & Themes</li><li>Phase 3: Unlisted Share Tokens</li></ul><h2>📈 Success Metrics</h2><p>Sub-second page loads and zero sharing friction.</p>',
  },
  {
    id: 'meeting',
    label: 'Design Decision Record',
    icon: '📋',
    description: 'Architecture trade-offs',
    title: 'Architecture Decision Record (ADR)',
    content:
      '<h2>Context</h2><p>Why do we need a personal-first page system over existing bloated tools?</p><h2>Decision</h2><p>Adopt PostgreSQL + Next.js + Drizzle ORM for full database ownership and clean unlisted sharing tokens.</p><h2>Consequences</h2><p>Zero lock-in, effortless deployments, and direct control over data.</p>',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const {
    pages,
    loading,
    error,
    createPage,
    deletePage,
    duplicatePage,
    refreshPages,
  } = usePages()

  const [userEmail, setUserEmail] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'private' | 'unlisted' | 'public'
  >('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'alphabetical'>(
    'updated'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Modals & Command Palette
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false)
  const [quickNoteTitle, setQuickNoteTitle] = useState('')
  const [quickNoteContent, setQuickNoteContent] = useState('')
  const [quickNoteSaving, setQuickNoteSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch current user email
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email)
        }
      })
      .catch(() => {})
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      toast.success('Signed out successfully')
      router.push('/auth/login')
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateWithTemplate = async (templateId: Template) => {
    const preset =
      TEMPLATE_PRESETS.find((t) => t.id === templateId) || TEMPLATE_PRESETS[0]
    try {
      const newPage = await createPage({
        title: preset.title,
        content: preset.content,
        template: preset.id,
        icon: preset.icon,
        visibility: 'private',
      })
      toast.success(`Created "${preset.title}"`)
      router.push(`/page/${newPage.id}`)
    } catch (err) {
      toast.error('Failed to create page')
    }
  }

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickNoteTitle.trim() && !quickNoteContent.trim()) return

    setQuickNoteSaving(true)
    try {
      const title = quickNoteTitle.trim() || 'Untitled Quick Note'
      const content = `<p>${quickNoteContent.replace(/\n/g, '<br/>')}</p>`
      const newPage = await createPage({
        title,
        content,
        template: 'notes',
        icon: '📝',
        visibility: 'private',
      })
      setQuickNoteTitle('')
      setQuickNoteContent('')
      setShowQuickNoteModal(false)
      toast.success('Quick note saved!')
      router.push(`/page/${newPage.id}`)
    } catch (err) {
      toast.error('Failed to save note')
    } finally {
      setQuickNoteSaving(false)
    }
  }

  const handleCopyLink = async (page: Page, e?: React.MouseEvent) => {
    e?.stopPropagation()
    let url = ''
    if (page.visibility === 'public') {
      url = `${window.location.origin}/p/${page.slug}`
    } else {
      url = `${window.location.origin}/page/${page.id}`
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(page.id)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const dup = await duplicatePage(id)
      toast.success(`Duplicated "${dup.title}"`)
    } catch {
      toast.error('Failed to duplicate page')
    }
  }

  const confirmDelete = async () => {
    if (!pageToDelete) return
    setIsDeleting(true)
    try {
      await deletePage(pageToDelete.id)
      toast.success('Page deleted')
      setPageToDelete(null)
    } catch {
      toast.error('Failed to delete page')
    } finally {
      setIsDeleting(false)
    }
  }

  // Count stats
  const counts = useMemo(() => {
    return {
      all: pages.length,
      private: pages.filter((p) => p.visibility === 'private').length,
      unlisted: pages.filter((p) => p.visibility === 'unlisted').length,
      public: pages.filter((p) => p.visibility === 'public').length,
    }
  }, [pages])

  // Filtered and sorted pages
  const filteredPages = useMemo(() => {
    let result = pages.filter((page) => {
      const matchesSearch =
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.content &&
          page.content.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesFilter =
        selectedFilter === 'all' ? true : page.visibility === selectedFilter

      return matchesSearch && matchesFilter
    })

    if (sortBy === 'updated') {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } else if (sortBy === 'created') {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [pages, searchQuery, selectedFilter, sortBy])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                Internet Notebook
              </h1>
              <span className="text-[11px] text-muted-foreground font-medium">
                Personal Knowledge Base
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Capture Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickNoteModal(true)}
            className="text-xs font-semibold gap-1.5 hidden sm:inline-flex border-border/80"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Note</span>
          </Button>

          {/* Search trigger button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommandOpen(true)}
            className="text-xs text-muted-foreground gap-2 hidden md:inline-flex border-border/80 px-3"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Search notebook...</span>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono text-muted-foreground">
              Ctrl+K
            </kbd>
          </Button>

          {/* New Page Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="glow" className="text-xs font-semibold gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>New Page</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Choose Template</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TEMPLATE_PRESETS.map((tmpl) => (
                <DropdownMenuItem
                  key={tmpl.id}
                  onClick={() => handleCreateWithTemplate(tmpl.id)}
                  className="flex items-start gap-2.5 py-2"
                >
                  <span className="text-base">{tmpl.icon}</span>
                  <div>
                    <div className="font-semibold text-xs text-foreground">{tmpl.label}</div>
                    <div className="text-[11px] text-muted-foreground">{tmpl.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-border/60 mx-1" />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold leading-none text-foreground">Signed in as</p>
                  <p className="text-[11px] leading-none text-muted-foreground font-mono truncate">
                    {userEmail || 'Personal Account'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowQuickNoteModal(true)}>
                <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-500" />
                <span>Quick Note</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">Ctrl+K</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateWithTemplate('blank')}>
                <Plus className="w-3.5 h-3.5 mr-2" />
                <span>New Blank Page</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Controls Bar: Search, Filters, View Modes */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by title or note contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-card/60 border-border/80 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Visibility Filter Tabs */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  selectedFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setSelectedFilter('private')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  selectedFilter === 'private'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-3 h-3 text-muted-foreground" />
                Private ({counts.private})
              </button>
              <button
                onClick={() => setSelectedFilter('unlisted')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  selectedFilter === 'unlisted'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-3 h-3 text-amber-500" />
                Shared ({counts.unlisted})
              </button>
              <button
                onClick={() => setSelectedFilter('public')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  selectedFilter === 'public'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="w-3 h-3 text-emerald-500" />
                Public ({counts.public})
              </button>
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-border/70">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Sort Pages By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('updated')}>
                  <Clock className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Recently Updated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')}>
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Date Created</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                  <FileText className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Title (A-Z)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-28 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-xs text-muted-foreground">Loading your notebook pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-20 px-6 border border-dashed border-border/80 rounded-3xl bg-card/30 backdrop-blur-sm">
            <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl shadow-xs">
              📝
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {searchQuery ? 'No matching pages found' : 'No notebook pages yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
              {searchQuery
                ? 'Try searching for a different keyword or reset the visibility filter.'
                : 'Start your personal notebook by creating a blank page or choosing a structured template below.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {TEMPLATE_PRESETS.slice(0, 4).map((tmpl) => (
                <Button
                  key={tmpl.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateWithTemplate(tmpl.id)}
                  className="text-xs gap-2 border-border/80"
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map((page) => {
              const isPublic = page.visibility === 'public'
              const isUnlisted = page.visibility === 'unlisted'
              const snippet = page.content ? stripHtml(page.content) : 'No content on this page yet...'

              return (
                <Card
                  key={page.id}
                  onClick={() => router.push(`/page/${page.id}`)}
                  className="group relative cursor-pointer interactive-card flex flex-col justify-between p-5 border-border/70 bg-card/80 backdrop-blur-sm hover:border-primary/50"
                >
                  <div>
                    {/* Top Row: Icon & Visibility Badge */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="text-2xl select-none w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center border border-border/60 shadow-xs group-hover:scale-105 transition-transform">
                        {page.icon || '📄'}
                      </div>
                      <Badge
                        variant={isPublic ? 'success' : isUnlisted ? 'warning' : 'outline'}
                        className="text-[11px] font-medium"
                      >
                        {isPublic ? (
                          <>
                            <Globe className="w-3 h-3" /> Public
                          </>
                        ) : isUnlisted ? (
                          <>
                            <LinkIcon className="w-3 h-3" /> Shared Link
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> Private
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground text-base mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                      {page.title || 'Untitled Page'}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                      {snippet || 'Empty note...'}
                    </p>
                  </div>

                  {/* Bottom Meta & Actions */}
                  <div className="pt-3.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(page.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleCopyLink(page, e)}
                        title="Copy Page Link"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === page.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDuplicate(page.id, e)}
                        title="Duplicate Page"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPageToDelete(page)
                        }}
                        title="Delete Page"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View Table */
          <div className="rounded-2xl border border-border/70 bg-card/80 overflow-hidden backdrop-blur-sm">
            <div className="divide-y divide-border/40">
              {filteredPages.map((page) => {
                const isPublic = page.visibility === 'public'
                const isUnlisted = page.visibility === 'unlisted'

                return (
                  <div
                    key={page.id}
                    onClick={() => router.push(`/page/${page.id}`)}
                    className="p-4 flex items-center justify-between hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{page.icon || '📄'}</span>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {page.title || 'Untitled Page'}
                        </h4>
                        <span className="text-[11px] text-muted-foreground">
                          Updated {formatRelativeTime(page.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant={isPublic ? 'success' : isUnlisted ? 'warning' : 'outline'}
                        className="text-[10px] hidden sm:inline-flex"
                      >
                        {isPublic ? 'Public' : isUnlisted ? 'Shared' : 'Private'}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleCopyLink(page, e)}
                        title="Copy Link"
                      >
                        {copiedId === page.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDuplicate(page.id, e)}
                        title="Duplicate"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPageToDelete(page)
                        }}
                        title="Delete"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Command Palette (Ctrl+K) */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search pages..." />
        <CommandList>
          <CommandEmpty>No matching pages found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false)
                setShowQuickNoteModal(true)
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Capture Quick Note</span>
              <CommandShortcut>Ctrl+K</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false)
                handleCreateWithTemplate('blank')
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Create Blank Page</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Templates">
            {TEMPLATE_PRESETS.map((tmpl) => (
              <CommandItem
                key={tmpl.id}
                onSelect={() => {
                  setIsCommandOpen(false)
                  handleCreateWithTemplate(tmpl.id)
                }}
              >
                <span className="text-base mr-1">{tmpl.icon}</span>
                <span>{tmpl.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Notebook Pages">
            {pages.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  setIsCommandOpen(false)
                  router.push(`/page/${p.id}`)
                }}
              >
                <span className="mr-1">{p.icon || '📄'}</span>
                <span>{p.title || 'Untitled Page'}</span>
                <CommandShortcut>{formatRelativeTime(p.updatedAt)}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Floating Quick Capture Dialog */}
      <Dialog open={showQuickNoteModal} onOpenChange={setShowQuickNoteModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <DialogTitle>Quick Note</DialogTitle>
            </div>
            <DialogDescription>
              Capture snippets, AI prompts, or server runbooks instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuickNote} className="space-y-4 pt-2">
            <div>
              <Input
                placeholder="Note title (optional)"
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                autoFocus
                className="bg-background/80 font-medium"
              />
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="Write anything... Paste links, code blocks, checklists, or prompts..."
                value={quickNoteContent}
                onChange={(e) => setQuickNoteContent(e.target.value)}
                className="w-full rounded-xl bg-background/80 border border-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent leading-relaxed"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickNoteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glow"
                size="sm"
                disabled={quickNoteSaving || (!quickNoteTitle.trim() && !quickNoteContent.trim())}
                className="font-semibold"
              >
                {quickNoteSaving ? 'Saving...' : 'Save & Open Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">"{pageToDelete?.title || 'this page'}"</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}