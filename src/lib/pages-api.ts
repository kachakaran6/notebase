import { db } from './db'
import { pages, shareLinks } from './db-schema'
import { eq, and, ilike, desc, or, ne } from 'drizzle-orm'
import { nanoid } from './utils'
import type { Page, NewPage } from './db-schema'

export type { Page, NewPage }

export type Visibility = 'private' | 'unlisted' | 'public'
export type Template = 'blank' | 'notes' | 'checklist' | 'prompt' | 'project' | 'meeting'

// Generate slug from title
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60) || 'untitled'
  return `${base}-${Math.random().toString(36).substr(2, 8)}`
}

// Create a new page
export async function createPage(
  userId: string,
  data: {
    title: string
    content?: string
    icon?: string
    cover?: string
    template?: Template
    visibility?: Visibility
  }
): Promise<Page> {
  const slug = generateSlug(data.title)
  const [newPage] = await db.insert(pages).values({
    userId,
    title: data.title,
    slug,
    content: data.content || null,
    icon: data.icon || null,
    cover: data.cover || null,
    template: data.template || 'blank',
    visibility: data.visibility || 'private',
  }).returning()
  return newPage
}

// Get all pages for a user
export async function getPages(userId: string): Promise<Page[]> {
  return await db
    .select()
    .from(pages)
    .where(eq(pages.userId, userId))
    .orderBy(desc(pages.updatedAt))
}

// Get a single page by ID (with optional user check)
export async function getPageById(id: string, userId?: string): Promise<Page | null> {
  const conditions = userId
    ? and(eq(pages.id, id), eq(pages.userId, userId))
    : eq(pages.id, id)
  const [page] = await db.select().from(pages).where(conditions)
  return page || null
}

// Search pages
export async function searchUserPages(userId: string, query: string): Promise<Page[]> {
  return await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.userId, userId),
        or(
          ilike(pages.title, `%${query}%`),
          ilike(pages.content, `%${query}%`)
        )
      )
    )
    .orderBy(desc(pages.updatedAt))
}

// Update a page
export async function updatePage(
  id: string,
  userId: string,
  updates: Partial<{
    title: string
    slug: string
    content: string | null
    icon: string | null
    cover: string | null
    template: Template
    visibility: Visibility
    font: string
    background: string
    accent: string
  }>
): Promise<Page> {
  const payload: Record<string, unknown> = { ...updates, updatedAt: new Date() }

  if (updates.slug !== undefined) {
    const normalizedSlug = updates.slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 80)

    if (normalizedSlug.length < 2) {
      throw new Error('Custom URL slug must be at least 2 characters')
    }

    // Check if another page is already using this slug
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.slug, normalizedSlug), ne(pages.id, id)))

    if (existing) {
      throw new Error('This custom URL slug is already taken. Please choose another.')
    }

    payload.slug = normalizedSlug
  }

  const [updatedPage] = await db
    .update(pages)
    .set(payload)
    .where(and(eq(pages.id, id), eq(pages.userId, userId)))
    .returning()

  if (!updatedPage) throw new Error('Page not found or access denied')
  return updatedPage
}

// Delete a page
export async function deletePage(id: string, userId: string): Promise<void> {
  const result = await db
    .delete(pages)
    .where(and(eq(pages.id, id), eq(pages.userId, userId)))
    .returning()

  if (result.length === 0) throw new Error('Page not found or access denied')
}

// Duplicate a page
export async function duplicatePage(id: string, userId: string): Promise<Page> {
  const original = await getPageById(id, userId)
  if (!original) throw new Error('Page not found or access denied')

  const [newPage] = await db.insert(pages).values({
    userId,
    title: `${original.title} (copy)`,
    slug: generateSlug(`${original.title} copy`),
    content: original.content,
    icon: original.icon,
    cover: original.cover,
    template: original.template,
    visibility: 'private',
    font: original.font,
    background: original.background,
    accent: original.accent,
  }).returning()
  return newPage
}

// Get page by slug for public viewing
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.visibility, 'public')))
  return page || null
}

// Create share link
export async function createShareLink(pageId: string, userId: string, expiresAt?: Date): Promise<string> {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)))

  if (!page) throw new Error('Page not found or access denied')

  // Check for existing non-revoked link
  const [existing] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.pageId, pageId), eq(shareLinks.isRevoked, false)))

  if (existing) return existing.token

  const token = nanoid(16)
  const [shareLink] = await db.insert(shareLinks).values({
    pageId,
    token,
    expiresAt: expiresAt || null,
  }).returning()

  return shareLink.token
}

// Get page by share token
export async function getPageByShareToken(token: string): Promise<Page | null> {
  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))

  if (!shareLink || shareLink.isRevoked) return null
  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) return null

  const [page] = await db.select().from(pages).where(eq(pages.id, shareLink.pageId))
  return page || null
}

// Get share links for a page
export async function getShareLinks(pageId: string, userId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)))

  if (!page) throw new Error('Page not found or access denied')

  return await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.pageId, pageId), eq(shareLinks.isRevoked, false)))
    .orderBy(desc(shareLinks.createdAt))
}

// Revoke share link
export async function revokeShareLink(token: string, userId: string): Promise<void> {
  // First verify the user owns the page
  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))

  if (!shareLink) throw new Error('Share link not found')

  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, shareLink.pageId), eq(pages.userId, userId)))

  if (!page) throw new Error('Access denied')

  await db
    .update(shareLinks)
    .set({ isRevoked: true })
    .where(eq(shareLinks.token, token))
}