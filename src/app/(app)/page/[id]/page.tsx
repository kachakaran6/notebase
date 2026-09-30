"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Share2,
  Lock,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  Palette,
  ExternalLink,
  RefreshCw,
  X,
  FileText,
  NotebookPen,
  ListChecks,
  Terminal,
  Code,
  FolderGit2,
  FileCheck,
  Bookmark,
  Sparkles,
  Key,
  Shield,
  Send,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { BrandLogo } from '@/components/brand-logo'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { usePage } from '@/hooks/use-page'
import { Page, Visibility, Template, Font, Background, Accent } from '@/types/page'
import dynamic from 'next/dynamic'
import { createShareLink, getShareLinks, revokeShareLink } from '@/lib/client-api'
import { toast } from 'sonner'

const TiptapEditor = dynamic(() => import('@/components/editor/tiptap-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[350px] text-muted-foreground">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
      <span className="text-xs">Loading document canvas...</span>
    </div>
  ),
})

const FONTS: { id: Font; label: string; preview: string; class: string }[] = [
  { id: 'inter', label: 'Inter', preview: 'Clean modern sans', class: 'font-inter' },
  { id: 'geist', label: 'Geist', preview: 'Monospaced clarity', class: 'font-geist' },
  { id: 'system', label: 'Editorial Serif', preview: 'Classic book serif', class: 'font-serif-elegant' },
]

const BACKGROUNDS: {
  id: Background
  label: string
  class: string
  previewColor: string
}[] = [
  {
    id: 'default',
    label: 'Default Surface',
    class: 'bg-page-default',
    previewColor: 'bg-background border-border',
  },
  {
    id: 'warm',
    label: 'Warm Linen',
    class: 'bg-page-warm',
    previewColor: 'bg-[#F7F6F2] dark:bg-[#171815] border-border',
  },
  {
    id: 'paper',
    label: 'Vintage Paper',
    class: 'bg-page-paper',
    previewColor: 'bg-[#F2EFE9] dark:bg-[#1B1D19] border-border',
  },
  {
    id: 'gray',
    label: 'Muted Slate',
    class: 'bg-page-slate',
    previewColor: 'bg-[#EFEFED] dark:bg-[#1A1B19] border-border',
  },
  {
    id: 'dark',
    label: 'Charcoal Dark',
    class: 'bg-page-dark',
    previewColor: 'bg-[#141512] border-border',
  },
]

export default function PageEditorPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = (params?.id as string) || ''

  const { page, loading, error, updatePage } = usePage(pageId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('FileText')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [template, setTemplate] = useState<Template>('blank')
  const [font, setFont] = useState<Font>('inter')
  const [background, setBackground] = useState<Background>('default')
  const [accent, setAccent] = useState<Accent>('blue')

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Modals & Popovers
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false)

  // Custom Slug Editing
  const [slugInput, setSlugInput] = useState('')
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [isSavingSlug, setIsSavingSlug] = useState(false)

  // Initialize state once page is fetched
  useEffect(() => {
    if (page) {
      setTitle(page.title || '')
      setContent(page.content || '')
      setIcon(page.icon || 'FileText')
      setVisibility(page.visibility || 'private')
      setTemplate(page.template || 'blank')
      setFont((page.font as Font) || 'inter')
      setBackground((page.background as Background) || 'default')
      setAccent((page.accent as Accent) || 'blue')
      setSlugInput(page.slug || '')
      setLastSaved(new Date(page.updatedAt))
    }
  }, [page])

  // Save handler
  const handleSave = useCallback(async () => {
    if (!pageId) return
    setIsSaving(true)
    try {
      await updatePage({
        title: title || 'Untitled',
        content,
        icon,
        visibility,
        template,
        font,
        background,
        accent,
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      toast.success('Document saved')
    } catch (err) {
      toast.error('Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }, [
    pageId,
    title,
    content,
    icon,
    visibility,
    template,
    font,
    background,
    accent,
    updatePage,
  ])

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Autosave after 2.5s of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const timer = setTimeout(() => {
      handleSave()
    }, 2500)
    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, handleSave])

  // Share link handler
  const handleOpenShare = async () => {
    setShowShareModal(true)
    setShareLoading(true)
    try {
      const links = await getShareLinks(pageId)
      if (links && links.length > 0) {
        const active = links.find((l: any) => !l.isRevoked)
        if (active) {
          setShareToken(active.token)
          setShareUrl(`${window.location.origin}/s/${active.token}`)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setShareLoading(false)
    }
  }

  const handleGenerateShareLink = async () => {
    setShareLoading(true)
    try {
      if (visibility === 'private') {
        setVisibility('unlisted')
        await updatePage({ visibility: 'unlisted' })
      }
      const res = await createShareLink(pageId)
      setShareToken(res.token)
      setShareUrl(`${window.location.origin}/s/${res.token}`)
      toast.success('Share link generated')
    } catch (e) {
      toast.error('Failed to generate link')
    } finally {
      setShareLoading(false)
    }
  }

  const handleRevokeShareLink = async () => {
    if (!shareToken) return
    setShareLoading(true)
    try {
      await revokeShareLink(shareToken)
      setShareToken(null)
      setShareUrl(null)
      toast.success('Share link revoked')
    } catch (e) {
      toast.error('Failed to revoke link')
    } finally {
      setShareLoading(false)
    }
  }

  const handleSaveSlug = async () => {
    if (!slugInput.trim() || !page) return
    setIsSavingSlug(true)
    try {
      const updated = await updatePage({ slug: slugInput.trim() })
      setSlugInput(updated.slug)
      setIsEditingSlug(false)
      toast.success(`Custom URL updated: /p/${updated.slug}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update custom URL')
    } finally {
      setIsSavingSlug(false)
    }
  }

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (e) {
      toast.error('Failed to copy')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs">Loading document...</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-sm w-full p-6 text-center shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-1">Page Not Found</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {error || "This document doesn't exist or you don't have permission to edit it."}
          </p>
          <Button onClick={() => router.push('/dashboard')} size="sm">
            Back to Notebase
          </Button>
        </Card>
      </div>
    )
  }

  const currentFontClass = FONTS.find((f) => f.id === font)?.class || 'font-inter'
  const currentBgClass = BACKGROUNDS.find((b) => b.id === background)?.class || 'bg-page-default'

  return (
    <div
      className={`min-h-screen ${currentFontClass} ${currentBgClass} flex flex-col font-inter transition-colors`}
    >
      {/* Top Application Bar (Fully responsive) */}
      <header className="sticky top-0 z-30 border-b border-border bg-card px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 min-w-0">
        {/* Left: Breadcrumbs / Back */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition font-medium shrink-0 p-1 -ml-1 rounded hover:bg-muted"
            title="Back to Notebase"
          >
            <BrandLogo size={18} />
            <span className="hidden xs:inline font-semibold text-foreground">Notebase</span>
          </Link>
          <span className="text-border shrink-0">/</span>
          <span className="text-foreground font-medium truncate max-w-[90px] xs:max-w-[140px] sm:max-w-[240px]">
            {title || 'Untitled'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Status Indicator (Desktop only) */}
          <div className="text-[11px] text-muted-foreground mr-1 hidden lg:inline-flex items-center gap-1.5 font-normal">
            {isSaving ? (
              <span className="flex items-center gap-1 text-primary">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-warning">Unsaved</span>
            ) : lastSaved ? (
              <span className="text-subtle-foreground">
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </div>

          {/* Visibility Selector */}
          <button
            onClick={handleOpenShare}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border bg-background transition cursor-pointer shrink-0"
            title="Manage sharing"
          >
            {visibility === 'public' ? (
              <>
                <Globe className="w-3 h-3 text-muted-foreground" />
                <span className="hidden sm:inline">Public</span>
              </>
            ) : visibility === 'unlisted' ? (
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
          </button>

          {/* Appearance Popover */}
          <Popover open={isStylePopoverOpen} onOpenChange={setIsStylePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-normal gap-1 h-8 px-2 sm:px-2.5 shrink-0"
                title="Document Style"
              >
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Style</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-32px)] sm:w-72 p-3 space-y-3" align="end">
              <div className="text-xs font-semibold text-foreground pb-1.5 border-b border-border">
                Document Appearance
              </div>

              {/* Typography */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Typography
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFont(f.id)
                        setHasUnsavedChanges(true)
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                        font === f.id
                          ? 'bg-muted text-foreground font-semibold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="text-[10px] text-subtle-foreground">{f.preview}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Theme */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Paper Texture
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBackground(b.id)
                        setHasUnsavedChanges(true)
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center gap-2 ${
                        background === b.id
                          ? 'bg-muted text-foreground font-semibold'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border ${b.previewColor}`} />
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenShare}
            className="text-xs font-normal gap-1 h-8 px-2 sm:px-2.5 shrink-0"
            title="Share Document"
          >
            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-medium gap-1 h-8 px-2.5 sm:px-3 shrink-0"
            title="Save Document (Ctrl+S)"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isSaving ? 'Saving' : 'Save'}</span>
          </Button>

          <div className="h-4 w-px bg-border mx-0.5 hidden xs:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* Editor Main Canvas */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        {/* Document Title Header */}
        <div className="mb-3 sm:mb-4 space-y-1 min-w-0">
          <input
            type="text"
            value={title}
            placeholder="Untitled Document"
            onChange={(e) => {
              setTitle(e.target.value)
              setHasUnsavedChanges(true)
            }}
            className="w-full bg-transparent border-none outline-none font-semibold text-xl sm:text-2xl md:text-3xl text-foreground placeholder:text-subtle-foreground/60 tracking-tight leading-tight min-w-0 break-words"
          />
        </div>

        {/* Embedded Tiptap Editor */}
        <TiptapEditor
          content={content}
          onChange={(newContent) => {
            setContent(newContent)
            setHasUnsavedChanges(true)
          }}
        />
      </main>

      {/* Share Modal Dialog */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Choose access visibility or generate an unlisted link for instant sharing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Visibility Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Access Mode
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {/* 1. Private */}
                <div
                  onClick={async () => {
                    setVisibility('private')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'private' })
                    toast.success('Document is now Private')
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                    visibility === 'private'
                      ? 'border-primary bg-muted font-medium'
                      : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                  }`}
                >
                  <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Private</div>
                    <div className="text-[11px] text-muted-foreground">Only you can view and edit.</div>
                  </div>
                </div>

                {/* 2. Unlisted Link */}
                <div
                  onClick={async () => {
                    setVisibility('unlisted')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'unlisted' })
                    toast.success('Document set to Share Link')
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                    visibility === 'unlisted'
                      ? 'border-primary bg-muted font-medium'
                      : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Anyone with link (Unlisted)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Read-only for anyone with secret URL. No login needed.
                    </div>
                  </div>
                </div>

                {/* 3. Public */}
                <div
                  onClick={async () => {
                    setVisibility('public')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'public' })
                    toast.success('Document is now Public')
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                    visibility === 'public'
                      ? 'border-primary bg-muted font-medium'
                      : 'border-border bg-card text-muted-foreground hover:border-border-strong'
                  }`}
                >
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">Public URL</div>
                    <div className="text-[11px] text-muted-foreground">
                      Publicly accessible at <span className="font-mono">/p/{page.slug}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Link Section with Editable URL Slug */}
            {visibility === 'public' && (
              <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Custom Public URL</span>
                  {!isEditingSlug ? (
                    <button
                      onClick={() => setIsEditingSlug(true)}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Edit URL slug
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSlugInput(page.slug)
                        setIsEditingSlug(false)
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isEditingSlug ? (
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground shrink-0 select-none">
                        /p/
                      </span>
                      <Input
                        value={slugInput}
                        onChange={(e) =>
                          setSlugInput(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, '-')
                              .replace(/-+/g, '-')
                          )
                        }
                        placeholder="custom-slug"
                        className="font-mono text-xs h-8 bg-card flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        disabled={isSavingSlug || !slugInput.trim() || slugInput === page.slug}
                        onClick={handleSaveSlug}
                        className="h-8 px-3 text-xs shrink-0 cursor-pointer"
                      >
                        {isSavingSlug ? 'Saving...' : 'Save URL'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Customize your link (e.g. <span className="font-mono text-foreground">server-deployment-notes</span>).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${page.slug}`}
                        className="font-mono text-xs h-8 bg-card select-all"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          handleCopyUrl(`${window.location.origin}/p/${page.slug}`)
                        }
                        className="h-8 px-2.5 text-xs shrink-0 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <a
                        href={`/p/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <span>Open public page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => setIsEditingSlug(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Change slug
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unlisted Link Section */}
            {visibility === 'unlisted' && (
              <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Secret Link</span>
                  {shareToken && (
                    <button
                      onClick={handleRevokeShareLink}
                      className="text-[11px] text-destructive hover:underline cursor-pointer"
                    >
                      Revoke token
                    </button>
                  )}
                </div>

                {shareUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={shareUrl}
                        className="font-mono text-xs h-8 bg-card select-all"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCopyUrl(shareUrl)}
                        className="h-8 px-2.5 text-xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Here is the note "${title || 'Untitled'}": ${shareUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send via WhatsApp</span>
                      </a>
                      <span className="text-subtle-foreground">•</span>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        Preview link
                      </a>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerateShareLink}
                    disabled={shareLoading}
                    className="w-full text-xs"
                  >
                    Generate Secret Link
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}