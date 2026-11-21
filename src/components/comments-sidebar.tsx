'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageSquare,
  Send,
  Heart,
  Pin,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  getPageComments,
  createPageComment,
  deletePageComment,
  likePageComment,
  togglePinPageComment,
} from '@/lib/client-api'
import { toast } from 'sonner'

export interface CommentsSidebarProps {
  isOpen: boolean
  onClose: () => void
  pageId: string
  pageTitle?: string
  isCommentsEnabled?: boolean
  onToggleCommentsEnabled?: (enabled: boolean) => Promise<void>
  onCommentsCountChange?: (count: number) => void
}

interface PageCommentItem {
  id: string
  pageId: string
  userId?: string | null
  authorName: string
  authorEmail?: string | null
  content: string
  isPinned: boolean
  isHidden: boolean
  likesCount: number
  createdAt: string
  updatedAt: string
}

export function CommentsSidebar({
  isOpen,
  onClose,
  pageId,
  pageTitle,
  isCommentsEnabled = true,
  onToggleCommentsEnabled,
  onCommentsCountChange,
}: CommentsSidebarProps) {
  const [comments, setComments] = useState<PageCommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [commentsActive, setCommentsActive] = useState(isCommentsEnabled)
  const countCallbackRef = useRef(onCommentsCountChange)
  countCallbackRef.current = onCommentsCountChange

  useEffect(() => {
    setCommentsActive(isCommentsEnabled)
  }, [isCommentsEnabled])

  // Fetch comments
  const fetchComments = useCallback(
    async (silent = false) => {
      if (!pageId) return
      if (!silent) setLoading(true)
      else setRefreshing(true)

      try {
        const res = await getPageComments(pageId)
        if (res) {
          const list = res.comments || []
          setComments(list)
          if (countCallbackRef.current) {
            countCallbackRef.current(list.length)
          }
          if (typeof res.isCommentsEnabled === 'boolean') {
            setCommentsActive(res.isCommentsEnabled)
          }
        }
      } catch {
        // silent catch
      } finally {
        if (!silent) setLoading(false)
        setRefreshing(false)
      }
    },
    [pageId]
  )

  // Initial load and periodic polling when sidebar is open
  useEffect(() => {
    if (pageId) {
      fetchComments(!isOpen)
    }
  }, [pageId, isOpen, fetchComments])

  useEffect(() => {
    if (!isOpen || !pageId) return
    const interval = setInterval(() => {
      fetchComments(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [isOpen, pageId, fetchComments])

  // Post owner comment / reply
  const handleSubmitReply = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = replyContent.trim()
    if (!content || submitting) return

    setSubmitting(true)
    const tempId = `temp-${Date.now()}`
    const optimistic: PageCommentItem = {
      id: tempId,
      pageId,
      authorName: 'Author (You)',
      content,
      isPinned: false,
      isHidden: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setComments((prev) => [optimistic, ...prev])
    setReplyContent('')

    try {
      const res = await createPageComment({
        pageId,
        authorName: 'Author',
        content,
      })
      if (res?.data) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? res.data : c))
        )
      } else {
        fetchComments(true)
      }
      toast.success('Comment posted')
    } catch (err: any) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      toast.error(err?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  // Like comment
  const handleLike = async (commentId: string) => {
    if (likedMap[commentId]) return
    setLikedMap((prev) => ({ ...prev, [commentId]: true }))
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likesCount: c.likesCount + 1 } : c
      )
    )
    try {
      await likePageComment(commentId)
    } catch {
      // ignore
    }
  }

  // Delete comment
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    const original = [...comments]
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    try {
      await deletePageComment(commentId)
      toast.success('Comment deleted')
      if (countCallbackRef.current) {
        countCallbackRef.current(comments.length - 1)
      }
    } catch (err: any) {
      setComments(original)
      toast.error(err?.message || 'Failed to delete comment')
    }
  }

  // Pin / unpin comment
  const handleTogglePin = async (commentId: string) => {
    try {
      const res = await togglePinPageComment(commentId)
      setComments((prev) =>
        prev
          .map((c) => (c.id === commentId ? { ...c, isPinned: res.isPinned } : c))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
      )
      toast.success(res.isPinned ? 'Comment pinned to top' : 'Comment unpinned')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle pin')
    }
  }

  // Toggle comments enabled switch
  const handleToggleEnabled = async (enabled: boolean) => {
    setCommentsActive(enabled)
    if (onToggleCommentsEnabled) {
      try {
        await onToggleCommentsEnabled(enabled)
      } catch {
        setCommentsActive(!enabled)
      }
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
      if (diffSec < 60) return 'just now'
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHr = Math.floor(diffMin / 60)
      if (diffHr < 24) return `${diffHr}h ago`
      const diffDay = Math.floor(diffHr / 24)
      if (diffDay < 7) return `${diffDay}d ago`
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return 'recently'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] sm:max-w-[420px] p-0 flex flex-col bg-card border-l border-border h-full shadow-2xl z-50 focus:outline-none"
        hideClose
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-card/90 backdrop-blur sticky top-0 z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground truncate">
                  Comments & Feedback
                </h2>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {comments.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Active Discussion</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchComments(true)}
              disabled={refreshing}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Refresh comments"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Owner Moderation & Settings Ribbon */}
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-medium">Allow visitor comments</span>
          </div>
          <Switch
            checked={commentsActive}
            onCheckedChange={handleToggleEnabled}
            aria-label="Toggle visitor comments"
          />
        </div>

        {/* Comments Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && comments.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <span>Loading document comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-16 text-center px-4 rounded-xl border border-dashed border-border bg-card/40 my-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs font-semibold text-foreground">No comments yet</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
                When readers view your public or shared note, any comments they post will appear here in real time.
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const hasLiked = Boolean(likedMap[comment.id])
              const initials = (comment.authorName || 'G')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                    comment.isPinned
                      ? 'border-amber-400/50 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                      : 'border-border bg-card hover:border-border-strong'
                  }`}
                >
                  {/* Header with avatar, author, actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {comment.authorName}
                          </span>
                          {comment.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.2 rounded-full">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner Action Buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(comment.id)}
                        title={comment.isPinned ? 'Unpin comment' : 'Pin to top'}
                        className={`p-1.5 rounded-md hover:bg-muted transition text-xs cursor-pointer ${
                          comment.isPinned ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        title="Delete comment"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed break-words pl-8">
                    {comment.content}
                  </p>

                  {/* Likes and stats */}
                  <div className="flex items-center justify-between pt-1 pl-8 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleLike(comment.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        hasLiked
                          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                          : 'text-muted-foreground hover:text-rose-500 hover:bg-muted'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Composer (Owner reply / post) */}
        <div className="p-3.5 border-t border-border bg-card/95 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Post reply as author</span>
            <span className="text-[10px]">Ctrl+Enter to post</span>
          </div>

          <form onSubmit={handleSubmitReply} className="space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSubmitReply()
                }
              }}
              placeholder="Write a response or note..."
              rows={2}
              className="text-xs resize-none bg-background leading-relaxed h-16"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Appears instantly on your public note
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !replyContent.trim()}
                className="h-7 px-3 text-xs gap-1 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Reply</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
