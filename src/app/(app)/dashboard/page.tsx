"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  NotebookPen,
  FileText,
  FilePlus,
  ListChecks,
  Terminal,
  FolderGit2,
  FileCheck,
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
  MoreHorizontal,
  ExternalLink,
  User,
  X,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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

interface TemplatePreset {
  id: Template
  label: string
  icon: typeof FileText
  description: string
  title: string
  content: string
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'blank',
    label: 'Blank Page',
    icon: FilePlus,
    description: 'Empty document',
    title: 'Untitled Page',
    content: '<p></p>',
  },
  {
    id: 'notes',
    label: 'Meeting Notes',
    icon: NotebookPen,
    description: 'Context, decisions, and action items',
    title: 'Meeting Notes',
    content:
      '<h2>Objectives</h2><p>Brief summary of meeting purpose.</p><h2>Key Decisions</h2><ul><li>Decision 1</li><li>Decision 2</li></ul><h2>Action Items</h2><ul><li>Follow up on delivery timeline</li><li>Review technical documentation</li></ul>',
  },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: ListChecks,
    description: 'Track procedures and deliverables',
    title: 'Project Checklist',
    content:
      '<h2>Tasks</h2><ul><li>Review system requirements</li><li>Verify database configuration</li><li>Test unlisted share links</li></ul>',
  },
  {
    id: 'prompt',
    label: 'Prompt / Runbook',
    icon: Terminal,
    description: 'Structured commands and system prompts',
    title: 'Technical Runbook',
    content:
      '<h2>Overview</h2><p>Operational instructions and persona guidelines.</p><h2>Commands</h2><pre><code># Run migration and verify tables\nnpm run build</code></pre><h2>Guidelines</h2><ul><li>Ensure type-safety</li><li>Verify error responses</li></ul>',
  },
  {
    id: 'project',
    label: 'Project Blueprint',
    icon: FolderGit2,
    description: 'Scope, timeline, and deliverables',
    title: 'Project Roadmap',
    content:
      '<h2>Vision</h2><p>Document goals and architectural decisions.</p><h2>Deliverables</h2><ul><li>Core API integration</li><li>Editorial document canvas</li></ul>',
  },
  {
    id: 'meeting',
    label: 'Decision Record',
    icon: FileCheck,
    description: 'Architecture and technical ADR',
    title: 'Architecture Decision Record',
    content:
      '<h2>Context</h2><p>Problem description and requirements.</p><h2>Decision</h2><p>Chosen approach and architectural rationale.</p><h2>Consequences</h2><p>Positive trade-offs and considerations.</p>',
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

  // Modals, Drawers & Command Palette
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  // Keyboard shortcut Ctrl+K / Cmd+K
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
      toast.success('Signed out')
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
        visibility: 'private',
      })
      setIsMobileMenuOpen(false)
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
      const title = quickNoteTitle.trim() || 'Untitled Note'
      const content = `<p>${quickNoteContent.replace(/\n/g, '<br/>')}</p>`
      const newPage = await createPage({
        title,
        content,
        template: 'notes',
        visibility: 'private',
      })
      setQuickNoteTitle('')
      setQuickNoteContent('')
      setShowQuickNoteModal(false)
      toast.success('Note saved')
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
      toast.success('Link copied to clipboard')
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-inter w-full overflow-x-hidden">
      {/* Top Navigation Header (Fully Responsive) */}
      <header className="border-b border-border bg-card sticky top-0 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5">
        {/* Main Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: App Logo & Name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 text-foreground hover:opacity-85 transition">
              <div className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center border border-border shrink-0">
                <NotebookPen className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Pages
              </span>
            </Link>
          </div>

          {/* Center Search Field (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="w-full h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-left text-xs text-muted-foreground flex items-center justify-between transition cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-subtle-foreground shrink-0" />
                <span className="truncate">Search pages, notes, prompts...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border text-subtle-foreground shrink-0 ml-2">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Quick Note Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickNoteModal(true)}
              className="text-xs font-medium gap-1.5 h-8 px-2.5"
            >
              <span>Quick Note</span>
            </Button>

            {/* New Page Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="text-xs font-medium gap-1 h-8 px-2.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Page</span>
                  <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Create with template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TEMPLATE_PRESETS.map((tmpl) => {
                  const IconComponent = tmpl.icon
                  return (
                    <DropdownMenuItem
                      key={tmpl.id}
                      onClick={() => handleCreateWithTemplate(tmpl.id)}
                      className="flex items-start gap-2 py-2"
                    >
                      <IconComponent className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-xs text-foreground truncate">{tmpl.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{tmpl.description}</div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center text-xs font-medium transition cursor-pointer shrink-0"
                  title={userEmail || 'Account'}
                >
                  {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="text-xs font-medium text-foreground truncate">
                    {userEmail || 'My Account'}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCommandOpen(true)}>
                  <Search className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>Command Menu</span>
                  <span className="ml-auto text-[10px] font-mono text-subtle-foreground">⌘K</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateWithTemplate('blank')}>
                  <FilePlus className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                  <span>New Blank Document</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Mobile Header Controls (Phone View) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {/* Quick New Page Button */}
            <Button
              size="sm"
              onClick={() => handleCreateWithTemplate('blank')}
              className="h-8 px-2 text-xs font-medium gap-1"
              title="New Blank Page"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </Button>

            <ThemeToggle />

            {/* Mobile Sheet Navigation Drawer */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center transition cursor-pointer"
                  title="Open Navigation Menu"
                  aria-label="Navigation Menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs p-5 flex flex-col justify-between">
                <div>
                  <SheetHeader className="pb-4 border-b border-border text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-secondary text-foreground flex items-center justify-center border border-border shrink-0">
                        <NotebookPen className="w-4 h-4 text-primary" />
                      </div>
                      <SheetTitle className="text-sm font-semibold">Pages</SheetTitle>
                    </div>
                    {userEmail && (
                      <div className="text-[11px] text-muted-foreground truncate pt-1 font-mono">
                        {userEmail}
                      </div>
                    )}
                  </SheetHeader>

                  {/* Actions List */}
                  <div className="py-4 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Quick Actions
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setShowQuickNoteModal(true)
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition text-left cursor-pointer"
                    >
                      <NotebookPen className="w-4 h-4 text-muted-foreground" />
                      <span>Quick Note</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsCommandOpen(true)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span>Search & Jump</span>
                      </div>
                      <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border text-subtle-foreground">
                        ⌘K
                      </kbd>
                    </button>

                    {/* Template creation */}
                    <div className="pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                        New Document
                      </div>
                      <div className="space-y-1 pt-1">
                        {TEMPLATE_PRESETS.map((tmpl) => {
                          const IconComp = tmpl.icon
                          return (
                            <button
                              key={tmpl.id}
                              onClick={() => handleCreateWithTemplate(tmpl.id)}
                              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-foreground hover:bg-muted transition text-left cursor-pointer"
                            >
                              <IconComp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{tmpl.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Signout */}
                <div className="pt-3 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Second Row on Mobile: Full-Width Search Bar */}
        <div className="sm:hidden pt-2.5">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-left text-xs text-muted-foreground flex items-center justify-between transition cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-subtle-foreground shrink-0" />
              <span className="truncate">Search pages...</span>
            </div>
            <kbd className="text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border text-subtle-foreground shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Top Header Section */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-1 break-words">
            Pages
          </h1>
          <p className="text-xs sm:text-sm text-secondary-foreground font-normal max-w-full break-words">
            Create, organize and share your notes, prompts and ideas.
          </p>
        </div>

        {/* Navigation Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-border pb-2 mb-4 sm:mb-5">
          {/* Tab Filtering (Responsive & Compact) */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto scrollbar-none py-1 -mb-[9px] min-w-0">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer shrink-0 ${
                selectedFilter === 'all'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('private')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedFilter === 'private'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span>Private</span>
            </button>
            <button
              onClick={() => setSelectedFilter('unlisted')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedFilter === 'unlisted'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3 h-3 text-muted-foreground" />
              <span>Shared</span>
            </button>
            <button
              onClick={() => setSelectedFilter('public')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedFilter === 'public'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span>Public</span>
            </button>
          </div>

          {/* Right Controls: Sort & Layout Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1 px-2 font-normal">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('updated')}>
                  <span>Recently Updated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')}>
                  <span>Date Created</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alphabetical')}>
                  <span>Title (A-Z)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-md bg-card p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
                aria-label="List view"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          /* Empty State */
          <div className="py-12 sm:py-16 text-center max-w-md w-full mx-auto px-2">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {searchQuery ? 'No matching pages' : 'No pages yet'}
            </h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              {searchQuery
                ? 'Try a different search keyword or clear the active filter.'
                : 'Create your first page or start with a template.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {TEMPLATE_PRESETS.slice(0, 4).map((tmpl) => {
                const IconComp = tmpl.icon
                return (
                  <Button
                    key={tmpl.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateWithTemplate(tmpl.id)}
                    className="text-xs gap-1.5"
                  >
                    <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{tmpl.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Responsive Edge-to-Edge Grid of Document Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5">
            {filteredPages.map((page) => {
              const isPublic = page.visibility === 'public'
              const isUnlisted = page.visibility === 'unlisted'
              const snippet = page.content
                ? stripHtml(page.content)
                : 'No content on this page.'

              return (
                <div
                  key={page.id}
                  onClick={() => router.push(`/page/${page.id}`)}
                  className="doc-card group relative p-3.5 sm:p-4 rounded-xl border border-border bg-card cursor-pointer flex flex-col justify-between hover:bg-card/90 transition shadow-2xs w-full min-w-0"
                >
                  <div className="min-w-0">
                    {/* Top row: Icon + Title + More menu */}
                    <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate min-w-0">
                          {page.title || 'Untitled'}
                        </h3>
                      </div>

                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                              title="More actions"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => handleCopyLink(page, e)}>
                              <Copy className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              <span>Copy link</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDuplicate(page.id, e)}>
                              <FolderPlus className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setPageToDelete(page)
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Middle preview */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3.5 break-words min-w-0">
                      {snippet}
                    </p>
                  </div>

                  {/* Bottom metadata (Responsive wrap) */}
                  <div className="pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-muted-foreground min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-subtle-foreground" />
                      <span>{formatRelativeTime(page.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      {isPublic ? (
                        <>
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span>Public</span>
                        </>
                      ) : isUnlisted ? (
                        <>
                          <LinkIcon className="w-3 h-3 text-muted-foreground" />
                          <span>Shared</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-subtle-foreground" />
                          <span>Private</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-xl border border-border bg-card overflow-hidden w-full">
            <div className="divide-y divide-border/60">
              {filteredPages.map((page) => {
                const isPublic = page.visibility === 'public'
                const isUnlisted = page.visibility === 'unlisted'

                return (
                  <div
                    key={page.id}
                    onClick={() => router.push(`/page/${page.id}`)}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 cursor-pointer transition-colors group min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate min-w-0">
                        {page.title || 'Untitled'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] text-subtle-foreground hidden md:inline">
                        {formatRelativeTime(page.updatedAt)}
                      </span>

                      <div className="flex items-center gap-1 text-[11px]">
                        {isPublic ? (
                          <>
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="hidden sm:inline">Public</span>
                          </>
                        ) : isUnlisted ? (
                          <>
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="hidden sm:inline">Shared</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-subtle-foreground" />
                            <span className="hidden sm:inline">Private</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleCopyLink(page, e)}
                        title="Copy Link"
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                        aria-label="Copy link"
                      >
                        {copiedId === page.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPageToDelete(page)
                        }}
                        title="Delete"
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition cursor-pointer"
                        aria-label="Delete page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Command Palette Modal (Ctrl+K / Cmd+K) */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Search documents or run action..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false)
                setShowQuickNoteModal(true)
              }}
            >
              <NotebookPen className="w-4 h-4 text-muted-foreground" />
              <span>Capture Quick Note</span>
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setIsCommandOpen(false)
                handleCreateWithTemplate('blank')
              }}
            >
              <FilePlus className="w-4 h-4 text-muted-foreground" />
              <span>Create Blank Document</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Templates">
            {TEMPLATE_PRESETS.map((tmpl) => {
              const IconComponent = tmpl.icon
              return (
                <CommandItem
                  key={tmpl.id}
                  onSelect={() => {
                    setIsCommandOpen(false)
                    handleCreateWithTemplate(tmpl.id)
                  }}
                >
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                  <span>{tmpl.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandGroup heading="Documents">
            {pages.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  setIsCommandOpen(false)
                  router.push(`/page/${p.id}`)
                }}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{p.title || 'Untitled'}</span>
                <CommandShortcut>{formatRelativeTime(p.updatedAt)}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Quick Note Capture Dialog */}
      <Dialog open={showQuickNoteModal} onOpenChange={setShowQuickNoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Note</DialogTitle>
            <DialogDescription>
              Capture notes, commands, or thoughts instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuickNote} className="space-y-3 pt-1">
            <div>
              <Input
                placeholder="Title (optional)"
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <textarea
                rows={5}
                placeholder="Write anything..."
                value={quickNoteContent}
                onChange={(e) => setQuickNoteContent(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
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
                size="sm"
                disabled={quickNoteSaving || (!quickNoteTitle.trim() && !quickNoteContent.trim())}
              >
                {quickNoteSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-foreground">"{pageToDelete?.title || 'Untitled'}"</strong>? This cannot be undone.
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}