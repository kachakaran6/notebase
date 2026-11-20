import { db } from './db'
import { pages, pageAnalyticsEvents, pageComments } from './db-schema'
import { eq, and, sql, desc, gte, inArray } from 'drizzle-orm'

export interface AnalyticsFilters {
  pageId?: string
  dateRange?: 'today' | '7d' | '30d' | '90d' | 'all'
  device?: string
}

export interface AnalyticsSummary {
  totalViews: number
  uniqueVisitors: number
  totalReadTimeSeconds: number
  avgReadTimeSeconds: number
  completionRate: number
  totalComments: number
}

export interface TimeseriesPoint {
  date: string
  label: string
  views: number
  reads: number
  avgReadTime: number
}

export interface CategoryBreakdown {
  name: string
  count: number
  percentage: number
}

export interface VisitorLogEntry {
  id: string
  pageId: string
  pageTitle: string
  pageSlug: string
  sessionId: string
  deviceType: string
  browser: string
  os: string
  referrer: string
  readTimeSeconds: number
  scrollDepthPercent: number
  createdAt: string
}

export interface AnalyticsOverviewResult {
  summary: AnalyticsSummary
  timeseries: TimeseriesPoint[]
  referrers: CategoryBreakdown[]
  devices: CategoryBreakdown[]
  browsers: CategoryBreakdown[]
  engagement: CategoryBreakdown[]
  recentLogs: VisitorLogEntry[]
}

// 1. Record an incoming telemetry event from a visitor
export async function recordAnalyticsEvent(data: {
  pageId: string
  sessionId: string
  eventType?: string
  readTimeSeconds?: number
  scrollDepthPercent?: number
  referrer?: string | null
  deviceType?: string | null
  browser?: string | null
  os?: string | null
  country?: string | null
}) {
  // First check if the page exists and if analytics is enabled
  const [page] = await db
    .select({
      id: pages.id,
      isAnalyticsEnabled: pages.isAnalyticsEnabled,
    })
    .from(pages)
    .where(eq(pages.id, data.pageId))

  if (!page || !page.isAnalyticsEnabled) {
    return { recorded: false, reason: 'Analytics disabled or page not found' }
  }

  const readTime = Math.max(0, Math.min(7200, Number(data.readTimeSeconds) || 0)) // capped at 2 hours max
  const scrollDepth = Math.max(0, Math.min(100, Number(data.scrollDepthPercent) || 0))

  // Normalize referrer
  let cleanReferrer = (data.referrer || '').trim()
  if (!cleanReferrer || cleanReferrer === 'null' || cleanReferrer === 'undefined') {
    cleanReferrer = 'Direct / Organic'
  } else {
    try {
      const url = new URL(cleanReferrer)
      if (url.hostname.includes('whatsapp') || url.hostname.includes('wa.me')) {
        cleanReferrer = 'WhatsApp'
      } else if (url.hostname.includes('twitter') || url.hostname.includes('x.com') || url.hostname.includes('t.co')) {
        cleanReferrer = 'Twitter / X'
      } else if (url.hostname.includes('google')) {
        cleanReferrer = 'Google Search'
      } else if (url.hostname.includes('linkedin')) {
        cleanReferrer = 'LinkedIn'
      } else if (url.hostname.includes('reddit')) {
        cleanReferrer = 'Reddit'
      } else if (url.hostname.includes('facebook') || url.hostname.includes('fb.com')) {
        cleanReferrer = 'Facebook'
      } else {
        cleanReferrer = url.hostname.replace(/^www\./, '')
      }
    } catch {
      // keep raw string up to 100 chars
      cleanReferrer = cleanReferrer.slice(0, 100)
    }
  }

  // Check if session record already exists for this visitor session on this page
  const [existing] = await db
    .select()
    .from(pageAnalyticsEvents)
    .where(
      and(
        eq(pageAnalyticsEvents.pageId, data.pageId),
        eq(pageAnalyticsEvents.sessionId, data.sessionId)
      )
    )
    .limit(1)

  if (existing) {
    // Update active reading time and maximum scroll depth
    const newReadTime = Math.max(existing.readTimeSeconds, readTime)
    const newScrollDepth = Math.max(existing.scrollDepthPercent, scrollDepth)

    await db
      .update(pageAnalyticsEvents)
      .set({
        readTimeSeconds: newReadTime,
        scrollDepthPercent: newScrollDepth,
        eventType: data.eventType || existing.eventType,
        updatedAt: new Date(),
      })
      .where(eq(pageAnalyticsEvents.id, existing.id))

    return { recorded: true, updated: true, id: existing.id }
  } else {
    // Insert new session event
    const id = crypto.randomUUID()
    await db.insert(pageAnalyticsEvents).values({
      id,
      pageId: data.pageId,
      sessionId: data.sessionId,
      eventType: data.eventType || 'view',
      readTimeSeconds: readTime,
      scrollDepthPercent: scrollDepth,
      referrer: cleanReferrer,
      deviceType: data.deviceType || 'desktop',
      browser: data.browser || 'Unknown',
      os: data.os || 'Unknown',
      country: data.country || null,
    })

    return { recorded: true, created: true, id }
  }
}

// 2. Query aggregated analytics for the owner dashboard
export async function getAnalyticsOverview(
  userId: string,
  filters: AnalyticsFilters = {}
): Promise<AnalyticsOverviewResult> {
  // First get all pages owned by this user
  const userPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      visibility: pages.visibility,
    })
    .from(pages)
    .where(eq(pages.userId, userId))

  if (userPages.length === 0) {
    return {
      summary: {
        totalViews: 0,
        uniqueVisitors: 0,
        totalReadTimeSeconds: 0,
        avgReadTimeSeconds: 0,
        completionRate: 0,
        totalComments: 0,
      },
      timeseries: [],
      referrers: [],
      devices: [],
      browsers: [],
      engagement: [],
      recentLogs: [],
    }
  }

  const pageMap = new Map(userPages.map((p) => [p.id, p]))
  const allowedPageIds = filters.pageId ? [filters.pageId] : userPages.map((p) => p.id)

  // Verify that if pageId is requested, user actually owns it
  if (filters.pageId && !pageMap.has(filters.pageId)) {
    throw new Error('Page not found or unauthorized')
  }

  // Calculate start date based on date range
  const now = new Date()
  let startDate: Date | null = null
  let daysCount = 7

  if (filters.dateRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    daysCount = 1
  } else if (filters.dateRange === '30d') {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    daysCount = 30
  } else if (filters.dateRange === '90d') {
    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    daysCount = 90
  } else if (filters.dateRange === 'all') {
    startDate = null
    daysCount = 60
  } else {
    // default: 7d
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    daysCount = 7
  }

  // Base conditions for events query
  const conditions = [inArray(pageAnalyticsEvents.pageId, allowedPageIds)]
  if (startDate) {
    conditions.push(gte(pageAnalyticsEvents.createdAt, startDate))
  }
  if (filters.device && filters.device !== 'all') {
    conditions.push(eq(pageAnalyticsEvents.deviceType, filters.device))
  }

  // Query events
  const events = await db
    .select()
    .from(pageAnalyticsEvents)
    .where(and(...conditions))
    .orderBy(desc(pageAnalyticsEvents.createdAt))

  // Query total comments for allowed pages
  const commentConditions = [
    inArray(pageComments.pageId, allowedPageIds),
    eq(pageComments.isHidden, false),
  ]
  if (startDate) {
    commentConditions.push(gte(pageComments.createdAt, startDate))
  }
  const comments = await db
    .select({ id: pageComments.id })
    .from(pageComments)
    .where(and(...commentConditions))

  const totalComments = comments.length

  // Calculate Summary Metrics
  const totalViews = events.length
  const uniqueSessionSet = new Set(events.map((e) => e.sessionId))
  const uniqueVisitors = uniqueSessionSet.size

  let totalReadTimeSeconds = 0
  let completedCount = 0

  const referrerCounts = new Map<string, number>()
  const deviceCounts = new Map<string, number>()
  const browserCounts = new Map<string, number>()
  const dateMap = new Map<string, { views: number; reads: number; totalDuration: number }>()

  // Engagement buckets
  let bounced = 0 // < 15s
  let skimmed = 0 // 15s - 1m
  let read = 0 // 1m - 3m
  let deepRead = 0 // 3m+

  // Populate dateMap with continuous dates if 7d, 30d, etc.
  if (daysCount <= 90 && startDate) {
    for (let i = 0; i <= daysCount; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      if (d <= now) {
        const key = d.toISOString().slice(0, 10)
        dateMap.set(key, { views: 0, reads: 0, totalDuration: 0 })
      }
    }
  }

  for (const ev of events) {
    totalReadTimeSeconds += ev.readTimeSeconds

    // Reader completion (read >= 30s or scrolled >= 75%)
    if (ev.scrollDepthPercent >= 75 || ev.readTimeSeconds >= 30) {
      completedCount++
    }

    // Engagement buckets
    if (ev.readTimeSeconds < 15) bounced++
    else if (ev.readTimeSeconds < 60) skimmed++
    else if (ev.readTimeSeconds < 180) read++
    else deepRead++

    // Referrers
    const ref = ev.referrer || 'Direct / Organic'
    referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1)

    // Devices
    const dev = (ev.deviceType || 'Desktop').toLowerCase()
    const devFormatted = dev.charAt(0).toUpperCase() + dev.slice(1)
    deviceCounts.set(devFormatted, (deviceCounts.get(devFormatted) || 0) + 1)

    // Browsers
    const brw = ev.browser || 'Other'
    browserCounts.set(brw, (browserCounts.get(brw) || 0) + 1)

    // Timeseries
    const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10)
    const currentDay = dateMap.get(dayKey) || { views: 0, reads: 0, totalDuration: 0 }
    currentDay.views += 1
    if (ev.readTimeSeconds >= 10 || ev.scrollDepthPercent >= 25) {
      currentDay.reads += 1
    }
    currentDay.totalDuration += ev.readTimeSeconds
    dateMap.set(dayKey, currentDay)
  }

  const avgReadTimeSeconds = uniqueVisitors > 0 ? Math.round(totalReadTimeSeconds / uniqueVisitors) : 0
  const completionRate = totalViews > 0 ? Math.round((completedCount / totalViews) * 100) : 0

  // Format timeseries array sorted chronologically
  const sortedDates = Array.from(dateMap.keys()).sort()
  const timeseries: TimeseriesPoint[] = sortedDates.map((d) => {
    const data = dateMap.get(d)!
    const dateObj = new Date(d + 'T00:00:00')
    const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const avgDuration = data.views > 0 ? Math.round(data.totalDuration / data.views) : 0
    return {
      date: d,
      label,
      views: data.views,
      reads: data.reads,
      avgReadTime: avgDuration,
    }
  })

  // Format category breakdowns
  const toCategoryBreakdown = (countsMap: Map<string, number>): CategoryBreakdown[] => {
    const total = Array.from(countsMap.values()).reduce((sum, v) => sum + v, 0)
    return Array.from(countsMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }

  const referrers = toCategoryBreakdown(referrerCounts)
  const devices = toCategoryBreakdown(deviceCounts)
  const browsers = toCategoryBreakdown(browserCounts)

  const engagement: CategoryBreakdown[] = [
    { name: '<15s (Quick glance)', count: bounced, percentage: totalViews > 0 ? Math.round((bounced / totalViews) * 100) : 0 },
    { name: '15s - 1m (Skimmed)', count: skimmed, percentage: totalViews > 0 ? Math.round((skimmed / totalViews) * 100) : 0 },
    { name: '1m - 3m (Engaged read)', count: read, percentage: totalViews > 0 ? Math.round((read / totalViews) * 100) : 0 },
    { name: '3m+ (Deep read)', count: deepRead, percentage: totalViews > 0 ? Math.round((deepRead / totalViews) * 100) : 0 },
  ]

  // Recent 50 visitor sessions log
  const recentLogs: VisitorLogEntry[] = events.slice(0, 50).map((ev) => {
    const page = pageMap.get(ev.pageId)
    return {
      id: ev.id,
      pageId: ev.pageId,
      pageTitle: page ? page.title : 'Untitled Page',
      pageSlug: page ? page.slug : '',
      sessionId: ev.sessionId.slice(0, 12) + '...',
      deviceType: ev.deviceType || 'desktop',
      browser: ev.browser || 'Unknown',
      os: ev.os || 'Unknown',
      referrer: ev.referrer || 'Direct / Organic',
      readTimeSeconds: ev.readTimeSeconds,
      scrollDepthPercent: ev.scrollDepthPercent,
      createdAt: new Date(ev.createdAt).toISOString(),
    }
  })

  return {
    summary: {
      totalViews,
      uniqueVisitors,
      totalReadTimeSeconds,
      avgReadTimeSeconds,
      completionRate,
      totalComments,
    },
    timeseries,
    referrers,
    devices,
    browsers,
    engagement,
    recentLogs,
  }
}
