'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Heart,
  Pin,
  Trash2,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { getPageComments, createPageComment, deletePageComment, likePageComment, togglePinPageComment } from '@/lib/client-api'
import { toast } from 'sonner'

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

interface LiveCommentsProps {
  pageId: string
  isCommentsEnabled?: boolean
  pageTitle?: string
}

export function LiveComments({
  pageId,
  isCommentsEnabled = true,
  pageTitle,
}: LiveCommentsProps) {
  const [comments, setComments] = useState<PageCommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [commentsActive, setCommentsActive] = useState(isCommentsEnabled)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  // Fetch comments
  const fetchComments = useCallback(async (silent = false) => {
    if (!pageId) return
    if (!silent) setLoading(true)
    try {
      const res = await getPageComments(pageId)
      if (res) {
        setComments(res.comments || [])
        setIsOwner(Boolean(res.isOwner))
        if (typeof res.isCommentsEnabled === 'boolean') {
          setCommentsActive(res.isCommentsEnabled)
        }
      }
    } catch {
      // silent catch for polling
    } finally {
      if (!silent) setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchComments()
    // Live active polling every 6 seconds
    const interval = setInterval(() => {
      fetchComments(true)
    }, 6000)
    return () => clearInterval(interval)
  }, [fetchComments])

  // Post comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newComment.trim()
    if (!content) return

    setSubmitting(true)
    const displayName = authorName.trim() || 'Guest Reader'

    // Optimistic comment item
    const tempId = `temp-${Date.now()}`
    const optimisticComment: PageCommentItem = {
      id: tempId,
      pageId,
      authorName: displayName,
      content,
      isPinned: false,
      isHidden: false,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setComments((prev) => [optimisticComment, ...prev])
    setNewComment('')

    try {
      const res = await createPageComment({
        pageId,
        authorName: displayName,
        content,
      })
      // Replace optimistic item with server result
      if (res?.data) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? res.data : c))
        )
      } else {
        fetchComments(true)
      }
      toast.success('Comment posted successfully')
    } catch (err: any) {
      // Revert optimistic
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      toast.error(err?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  // Like comment
  const handleLike = async (commentId: string) => {
    if (likedMap[commentId]) return // already liked locally

    setLikedMap((prev) => ({ ...prev, [commentId]: true }))
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likesCount: c.likesCount + 1 } : c
      )
    )

    try {
      await likePageComment(commentId)
    } catch {
      // ignore like failure
    }
  }

  // Delete comment (Owner or Author)
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    const original = [...comments]
    setComments((prev) => prev.filter((c) => c.id !== commentId))

    try {
      await deletePageComment(commentId)
      toast.success('Comment deleted')
    } catch (err: any) {
      setComments(original)
      toast.error(err?.message || 'Failed to delete comment')
    }
  }

  // Pin comment (Owner only)
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

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
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

  if (!commentsActive) {
    return (
      <section className="mt-12 pt-8 border-t border-border">
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground bg-muted/20">
          <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-medium">Comments are disabled for this document.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>Discussion & Feedback</span>
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Live conversation on {pageTitle ? `"${pageTitle}"` : 'this note'}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Owner Moderation Active</span>
          </div>
        )}
      </div>

      {/* Comment Composer */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name or handle (optional)"
            className="text-xs h-8 bg-background flex-1"
            maxLength={60}
          />
        </div>

        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment, share your thoughts, or ask a question..."
          rows={3}
          className="text-xs resize-none bg-background leading-relaxed"
          required
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Updates live in real-time</span>
          </span>

          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newComment.trim()}
            className="h-8 px-4 text-xs font-medium cursor-pointer"
          >
            {submitting ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
                <span>Posting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Comment</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading && comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading active discussion...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-border bg-card/30">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-xs font-medium text-foreground">No comments yet</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Be the first to leave a thought or start a conversation.
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
                className={`p-4 rounded-xl border transition-all ${
                  comment.isPinned
                    ? 'border-amber-400/50 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm'
                    : 'border-border bg-card hover:border-border-strong'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {comment.authorName}
                        </span>
                        {comment.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                            <Pin className="w-2.5 h-2.5 fill-current" />
                            <span>Pinned</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Pin / Delete for Owner */}
                  <div className="flex items-center gap-1">
                    {isOwner && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed break-words pl-9">
                  {comment.content}
                </p>

                {/* Footer with Like Button */}
                <div className="flex items-center justify-between pt-2 pl-9 mt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      hasLiked
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                        : 'text-muted-foreground hover:text-rose-500 hover:bg-muted'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
