import { db } from './db'
import { pages, pageComments } from './db-schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { PageComment } from '@/types/page'

export interface CreateCommentInput {
  pageId: string
  authorName: string
  authorEmail?: string | null
  content: string
  userId?: string | null
}

export interface GetCommentsResult {
  comments: PageComment[]
  isCommentsEnabled: boolean
  isOwner: boolean
}

// 1. Post a new comment
export async function createComment(input: CreateCommentInput): Promise<PageComment> {
  const content = (input.content || '').trim()
  if (!content) {
    throw new Error('Comment content cannot be empty')
  }
  if (content.length > 3000) {
    throw new Error('Comment cannot exceed 3000 characters')
  }

  const authorName = (input.authorName || '').trim().slice(0, 100) || 'Guest Reader'
  const authorEmail = input.authorEmail ? input.authorEmail.trim().slice(0, 255) : null

  // Check that the page exists and comments are enabled
  const [page] = await db
    .select({
      id: pages.id,
      isCommentsEnabled: pages.isCommentsEnabled,
    })
    .from(pages)
    .where(eq(pages.id, input.pageId))

  if (!page) {
    throw new Error('Page not found')
  }

  if (!page.isCommentsEnabled) {
    throw new Error('Comments are disabled for this page')
  }

  const id = crypto.randomUUID()
  await db.insert(pageComments).values({
    id,
    pageId: input.pageId,
    userId: input.userId || null,
    authorName,
    authorEmail,
    content,
    isPinned: false,
    isHidden: false,
    likesCount: 0,
  })

  const [created] = await db
    .select()
    .from(pageComments)
    .where(eq(pageComments.id, id))

  if (!created) {
    throw new Error('Failed to create comment')
  }

  return created
}

// 2. Fetch comments for a page
export async function getCommentsForPage(
  pageId: string,
  currentUserId?: string
): Promise<GetCommentsResult> {
  const [page] = await db
    .select({
      id: pages.id,
      userId: pages.userId,
      isCommentsEnabled: pages.isCommentsEnabled,
    })
    .from(pages)
    .where(eq(pages.id, pageId))

  if (!page) {
    return { comments: [], isCommentsEnabled: false, isOwner: false }
  }

  const isOwner = Boolean(currentUserId && currentUserId === page.userId)

  const conditions = [eq(pageComments.pageId, pageId)]
  if (!isOwner) {
    conditions.push(eq(pageComments.isHidden, false))
  }

  const comments = await db
    .select()
    .from(pageComments)
    .where(and(...conditions))
    .orderBy(desc(pageComments.isPinned), desc(pageComments.createdAt))

  return {
    comments,
    isCommentsEnabled: page.isCommentsEnabled,
    isOwner,
  }
}

// 3. Like a comment
export async function likeComment(commentId: string): Promise<number> {
  await db
    .update(pageComments)
    .set({
      likesCount: sql`${pageComments.likesCount} + 1`,
    })
    .where(eq(pageComments.id, commentId))

  const [comment] = await db
    .select({ likesCount: pageComments.likesCount })
    .from(pageComments)
    .where(eq(pageComments.id, commentId))

  return comment ? comment.likesCount : 0
}

// 4. Delete a comment (Owner of page or Author of comment)
export async function deleteComment(
  commentId: string,
  currentUserId?: string
): Promise<boolean> {
  const [comment] = await db
    .select()
    .from(pageComments)
    .where(eq(pageComments.id, commentId))

  if (!comment) {
    throw new Error('Comment not found')
  }

  // Get parent page
  const [page] = await db
    .select({ id: pages.id, userId: pages.userId })
    .from(pages)
    .where(eq(pages.id, comment.pageId))

  const isOwner = Boolean(currentUserId && page && currentUserId === page.userId)
  const isAuthor = Boolean(currentUserId && comment.userId && currentUserId === comment.userId)

  if (!isOwner && !isAuthor) {
    throw new Error('Unauthorized to delete this comment')
  }

  await db.delete(pageComments).where(eq(pageComments.id, commentId))
  return true
}

// 5. Toggle pin a comment (Page owner only)
export async function togglePinComment(
  commentId: string,
  currentUserId: string
): Promise<boolean> {
  const [comment] = await db
    .select()
    .from(pageComments)
    .where(eq(pageComments.id, commentId))

  if (!comment) {
    throw new Error('Comment not found')
  }

  const [page] = await db
    .select({ id: pages.id, userId: pages.userId })
    .from(pages)
    .where(eq(pages.id, comment.pageId))

  if (!page || page.userId !== currentUserId) {
    throw new Error('Only the page owner can pin comments')
  }

  const newPinned = !comment.isPinned
  await db
    .update(pageComments)
    .set({ isPinned: newPinned })
    .where(eq(pageComments.id, commentId))

  return newPinned
}
