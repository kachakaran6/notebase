import { z } from 'zod'

// Page visibility types
export const VISIBILITY = ['private', 'unlisted', 'public'] as const
export type Visibility = typeof VISIBILITY[number]

// Page template types
export const TEMPLATES = ['blank', 'notes', 'checklist', 'prompt', 'project', 'meeting'] as const
export type Template = typeof TEMPLATES[number]

// Font options
export const FONTS = ['inter', 'geist', 'dm-sans', 'manrope', 'system'] as const
export type Font = typeof FONTS[number]

// Background options
export const BACKGROUNDS = ['default', 'warm', 'paper', 'dark', 'gray', 'gradient'] as const
export type Background = typeof BACKGROUNDS[number]

// Accent options
export const ACCENTS = ['blue', 'purple', 'green', 'orange', 'red'] as const
export type Accent = typeof ACCENTS[number]

// Page schema
export const pageSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  slug: z.string().min(1).max(255),
  content: z.string().nullable(),
  icon: z.string().max(100).nullable(),
  cover: z.string().max(255).nullable(),
  template: z.enum(TEMPLATES).default('blank'),
  visibility: z.enum(VISIBILITY).default('private'),
  font: z.string().default('inter'),
  background: z.string().default('default'),
  accent: z.string().default('blue'),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})

// New page schema (for creation)
export const newPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().optional(),
  icon: z.string().max(100).optional(),
  cover: z.string().max(255).optional(),
  template: z.enum(TEMPLATES).default('blank'),
  visibility: z.enum(VISIBILITY).default('private'),
})

// Page API types
export interface Page {
  id: string
  userId: string
  title: string
  slug: string
  content: string | null
  icon: string | null
  cover: string | null
  template: Template
  visibility: Visibility
  font: string | null
  background: string | null
  accent: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export type NewPage = z.infer<typeof newPageSchema>

// Share link types
export interface ShareLink {
  id: string
  pageId: string
  token: string
  expiresAt: Date | string | null
  createdAt: Date | string
  isRevoked: boolean
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}