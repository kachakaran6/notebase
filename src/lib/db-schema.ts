import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int } from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const pages = mysqlTable('pages', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  icon: varchar('icon', { length: 100 }),
  cover: varchar('cover', { length: 255 }),
  template: mysqlEnum('template', ['blank', 'notes', 'checklist', 'prompt', 'project', 'meeting']).default('blank').notNull(),
  visibility: mysqlEnum('visibility', ['private', 'unlisted', 'public']).default('private').notNull(),
  font: varchar('font', { length: 50 }).default('inter'),
  background: varchar('background', { length: 50 }).default('default'),
  accent: varchar('accent', { length: 50 }).default('blue'),
  isAnalyticsEnabled: boolean('is_analytics_enabled').default(true).notNull(),
  isCommentsEnabled: boolean('is_comments_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const shareLinks = mysqlTable('share_links', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pageAnalyticsEvents = mysqlTable('page_analytics_events', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  eventType: varchar('event_type', { length: 32 }).default('view').notNull(),
  readTimeSeconds: int('read_time_seconds').default(0).notNull(),
  scrollDepthPercent: int('scroll_depth_percent').default(0).notNull(),
  referrer: varchar('referrer', { length: 512 }),
  deviceType: varchar('device_type', { length: 32 }),
  browser: varchar('browser', { length: 64 }),
  os: varchar('os', { length: 64 }),
  country: varchar('country', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const pageComments = mysqlTable('page_comments', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: varchar('page_id', { length: 36 }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  authorEmail: varchar('author_email', { length: 255 }),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  likesCount: int('likes_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

// Export types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type ShareLink = typeof shareLinks.$inferSelect
export type NewShareLink = typeof shareLinks.$inferInsert
export type PageAnalyticsEvent = typeof pageAnalyticsEvents.$inferSelect
export type NewPageAnalyticsEvent = typeof pageAnalyticsEvents.$inferInsert
export type PageComment = typeof pageComments.$inferSelect
export type NewPageComment = typeof pageComments.$inferInsert
