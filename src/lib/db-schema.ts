import { pgTable, serial, varchar, text, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core'

export const visibilityEnum = pgEnum('visibility', ['private', 'unlisted', 'public'])
export const templateEnum = pgEnum('template', ['blank', 'notes', 'checklist', 'prompt', 'project', 'meeting'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  icon: varchar('icon', { length: 100 }),
  cover: varchar('cover', { length: 255 }),
  template: templateEnum('template').default('blank').notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  font: varchar('font', { length: 50 }).default('inter'),
  background: varchar('background', { length: 50 }).default('default'),
  accent: varchar('accent', { length: 50 }).default('blue'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const shareLinks = pgTable('share_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Export types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type ShareLink = typeof shareLinks.$inferSelect
export type NewShareLink = typeof shareLinks.$inferInsert