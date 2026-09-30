"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Trash2,
  FolderPlus,
  Palette,
  Eye,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  QrCode,
  Smartphone,
  ChevronDown,
  Clock,
  MoreVertical,
  CheckCircle2,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { usePage } from '@/hooks/use-page'
import { Page, Visibility, Template, Font, Background, Accent } from '@/types/page'
import dynamic from 'next/dynamic'
import { createShareLink, getShareLinks, revokeShareLink } from '@/lib/client-api'
import { toast } from 'sonner'

const TiptapEditor = dynamic(() => import('@/components/editor/tiptap-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[350px] text-muted-foreground">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
      <span className="text-xs">Loading editor canvas...</span>
    </div>
  ),
})

const FONTS: { id: Font; label: string; preview: string; class: string }[] = [
  { id: 'inter', label: 'Inter', preview: 'Clean & Modern Sans', class: 'font-inter' },
  { id: 'geist', label: 'Geist / Neo', preview: 'Clean Precision', class: 'font-geist' },
  { id: 'dm-sans', label: 'DM Sans', preview: 'Friendly Geometric', class: 'font-dm-sans' },
  { id: 'manrope', label: 'Jakarta / Manrope', preview: 'High-Tech Display', class: 'font-manrope' },
  { id: 'system', label: 'Editorial Serif', preview: 'Elegant Literature', class: 'font-serif-elegant' },
]

const BACKGROUNDS: {
  id: Background
  label: string
  desc: string
  class: string
  previewClass: string
}[] = [
  {
    id: 'default',
    label: 'Clean Studio',
    desc: 'Adaptive light/dark background',
    class: 'bg-page-default',
    previewClass: 'bg-background border-border',
  },
  {
    id: 'warm',
    label: 'Warm Linen',
    desc: 'Cozy ivory and gentle shadows',
    class: 'bg-page-warm',
    previewClass: 'bg-[#faf8f5] dark:bg-[#1a1816] border-amber-200/50 dark:border-amber-900/40',
  },
  {
    id: 'paper',
    label: 'Vintage Paper',
    desc: 'Classic notebook texture',
    class: 'bg-page-paper',
    previewClass: 'bg-[#f6f5ee] dark:bg-[#151614] border-stone-300 dark:border-stone-800',
  },
  {
    id: 'gray',
    label: 'Slate Modern',
    desc: 'Minimal slate tint',
    class: 'bg-page-gray',
    previewClass: 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800',
  },
  {
    id: 'gradient',
    label: 'Aurora Glow',
    desc: 'Subtle ambient pastels',
    class: 'bg-page-gradient',
    previewClass: 'bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-900 dark:to-indigo-950 border-indigo-200 dark:border-indigo-900',
  },
  {
    id: 'dark',
    label: 'Midnight Velvet',
    desc: 'Ultra deep dark contrast',
    class: 'bg-page-dark text-slate-100',
    previewClass: 'bg-[#0b0f19] border-slate-800',
  },
]

const EMOJI_CATEGORIES = [
  { label: 'Work & Code', emojis: ['📄', '📝', '💻', '🧠', '🛠️', '🚀', '⚡', '🤖', '📊', '🔍', '⚙️', '📂'] },
  { label: 'Ideas & Focus', emojis: ['💡', '✨', '🎯', '🔥', '📚', '🌟', '🎨', '🏷️', '💎', '🔑', '📌', '☕'] },
  { label: 'Status & Security', emojis: ['🔒', '🌍', '🔗', '✅', '⚠️', '🛡️', '📦', '📋', '💬', '🎉', '🏆', '🍕'] },
]

export default function PageEditorPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = (params?.id as string) || ''

  const { page, loading, error, updatePage } = usePage(pageId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('📄')
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isStylePopoverOpen, setIsStylePopoverOpen] = useState(false)
  const [isWideLayout, setIsWideLayout] = useState(false)

  // Initialize state once page is fetched
  useEffect(() => {
    if (page) {
      setTitle(page.title || '')
      setContent(page.content || '')
      setIcon(page.icon || '📄')
      setVisibility(page.visibility || 'private')
      setTemplate(page.template || 'blank')
      setFont((page.font as Font) || 'inter')
      setBackground((page.background as Background) || 'default')
      setAccent((page.accent as Accent) || 'blue')
      setLastSaved(new Date(page.updatedAt))
    }
  }, [page])

  // Save handler
  const handleSave = useCallback(async () => {
    if (!pageId) return
    setIsSaving(true)
    try {
      await updatePage({
        title: title || 'Untitled Page',
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
      toast.success('Notebook page saved!')
    } catch (err) {
      toast.error('Failed to save page')
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

  // Keyboard shortcut Ctrl+S / Cmd+S for saving
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

  // Autosave after 2.5 seconds of inactivity
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
      toast.success('Secret share link generated!')
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

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (e) {
      toast.error('Failed to copy')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-xs">Loading notebook document...</p>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center shadow-2xl rounded-3xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-foreground mb-2">Page Not Found</h2>
          <p className="text-xs text-muted-foreground mb-6">
            {error || "This document doesn't exist or you don't have permission to edit it."}
          </p>
          <Button onClick={() => router.push('/dashboard')} variant="glow" size="sm">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const currentFontClass = FONTS.find((f) => f.id === font)?.class || 'font-inter'
  const currentBgClass = BACKGROUNDS.find((b) => b.id === background)?.class || 'bg-page-default'

  return (
    <div
      className={`min-h-screen ${currentFontClass} ${currentBgClass} flex flex-col transition-colors duration-300 selection:bg-primary/20 selection:text-primary`}
    >
      {/* Top Floating App Bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          <div className="h-4 w-px bg-border/80" />

          {/* Visibility indicator & trigger */}
          <button
            onClick={handleOpenShare}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition"
            title="Click to manage sharing"
          >
            {visibility === 'public' ? (
              <Badge variant="success" className="text-[11px] font-semibold py-0.5">
                <Globe className="w-3 h-3" /> Public URL
              </Badge>
            ) : visibility === 'unlisted' ? (
              <Badge variant="warning" className="text-[11px] font-semibold py-0.5">
                <LinkIcon className="w-3 h-3" /> Shared Link
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] font-semibold py-0.5">
                <Lock className="w-3 h-3" /> Private
              </Badge>
            )}
          </button>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-2">
          {/* Autosave Status Indicator */}
          <div className="text-[11px] text-muted-foreground mr-1 hidden md:inline-flex items-center gap-1.5">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-primary">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </div>

          {/* Width Layout Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsWideLayout((prev) => !prev)}
            title={isWideLayout ? 'Standard Width' : 'Wide Width'}
            className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          >
            {isWideLayout ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>

          {/* Appearance & Style Popover (Module 7) */}
          <Popover open={isStylePopoverOpen} onOpenChange={setIsStylePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 font-semibold border-border/80"
              >
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Appearance</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4" align="end">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Style & Typography</span>
                </div>
              </div>

              {/* Font Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Typography Style
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFont(f.id)
                        setHasUnsavedChanges(true)
                      }}
                      className={`text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                        font === f.id
                          ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{f.label}</div>
                        <div className="text-[10px] text-muted-foreground">{f.preview}</div>
                      </div>
                      {font === f.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Palette */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Canvas Mood & Theme
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BACKGROUNDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBackground(b.id)
                        setHasUnsavedChanges(true)
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                        background === b.id
                          ? 'border-primary ring-1 ring-primary bg-primary/5 font-semibold text-primary'
                          : 'border-border hover:border-border/90 text-foreground'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${b.previewClass}`} />
                      <span className="truncate text-[11px]">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Instant Share Button (Module 8) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenShare}
            className="text-xs gap-1.5 font-semibold border-border/80"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Share</span>
          </Button>

          {/* Save Button */}
          <Button
            size="sm"
            variant="glow"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-semibold gap-1.5 shadow-sm"
            title="Save Page (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </Button>

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>
      </header>

      {/* Editor Canvas Main */}
      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-8 py-8 transition-all duration-300 ${
          isWideLayout ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Document Header (Icon + Title) */}
        <div className="mb-6 space-y-3">
          {/* Emoji Picker Popover */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-3xl p-2 rounded-2xl hover:bg-muted/80 transition-all select-none flex items-center justify-center w-14 h-14 border border-border/40 bg-card/60 shadow-xs cursor-pointer group"
                title="Change page icon"
              >
                <span className="group-hover:scale-110 transition-transform">{icon}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="start">
              <div className="text-xs font-bold text-foreground">Select Icon / Emoji</div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      {cat.label}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {cat.emojis.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            setIcon(em)
                            setHasUnsavedChanges(true)
                            setIsEmojiPickerOpen(false)
                          }}
                          className="p-1.5 text-lg rounded-lg hover:bg-muted transition text-center cursor-pointer hover:scale-110"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            placeholder="Untitled Document"
            onChange={(e) => {
              setTitle(e.target.value)
              setHasUnsavedChanges(true)
            }}
            className="w-full bg-transparent border-none outline-none font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground placeholder:text-muted-foreground/50 tracking-tight leading-tight"
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

      {/* Share Modal Dialog (Module 8) */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <DialogTitle>Share Notebook Document</DialogTitle>
            </div>
            <DialogDescription>
              Control access levels and generate unlisted read-only links for WhatsApp or team chats.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Visibility Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Access Level</label>
              <div className="grid grid-cols-1 gap-2">
                {/* 1. Private */}
                <div
                  onClick={async () => {
                    setVisibility('private')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'private' })
                    toast.success('Visibility set to Private')
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    visibility === 'private'
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border hover:border-border/80 bg-card/60 text-muted-foreground'
                  }`}
                >
                  <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-foreground">🔒 Private (Only You)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Only authenticated account owner can view and edit this document.
                    </div>
                  </div>
                </div>

                {/* 2. Unlisted Link */}
                <div
                  onClick={async () => {
                    setVisibility('unlisted')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'unlisted' })
                    toast.success('Visibility set to Secret Link')
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    visibility === 'unlisted'
                      ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500'
                      : 'border-border hover:border-border/80 bg-card/60 text-muted-foreground'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-foreground">🔗 Secret Share Link (Unlisted)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Anyone with the 16-character link can read in view-only mode. No account needed.
                    </div>
                  </div>
                </div>

                {/* 3. Public Web URL */}
                <div
                  onClick={async () => {
                    setVisibility('public')
                    setHasUnsavedChanges(true)
                    await updatePage({ visibility: 'public' })
                    toast.success('Visibility set to Public URL')
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    visibility === 'public'
                      ? 'border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500'
                      : 'border-border hover:border-border/80 bg-card/60 text-muted-foreground'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-foreground">🌍 Public Web Page</div>
                    <div className="text-[11px] text-muted-foreground">
                      Accessible at <span className="font-mono">/p/{page.slug}</span>. Indexable on the web.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Link Preview */}
            {visibility === 'public' && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Public Note URL</span>
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${page.slug}`}
                    className="font-mono text-xs h-9 bg-background select-all"
                  />
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() =>
                      handleCopyUrl(
                        `${window.location.origin}/p/${page.slug}`
                      )
                    }
                    className="h-9 px-3 text-xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Unlisted Secret Link */}
            {visibility === 'unlisted' && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Secret Read-Only Link</span>
                  {shareToken && (
                    <button
                      onClick={handleRevokeShareLink}
                      className="text-[11px] text-destructive hover:underline cursor-pointer"
                    >
                      Revoke link token
                    </button>
                  )}
                </div>

                {shareUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={shareUrl}
                        className="font-mono text-xs h-9 bg-background select-all"
                      />
                      <Button
                        size="sm"
                        variant="glow"
                        onClick={() => handleCopyUrl(shareUrl)}
                        className="h-9 px-3 text-xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>

                    {/* WhatsApp Quick Share Button */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Here is the note "${title || 'Notebook Document'}": ${shareUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview Reader</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={handleGenerateShareLink}
                    disabled={shareLoading}
                    className="w-full text-xs"
                  >
                    Generate Secret 16-Char Link
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