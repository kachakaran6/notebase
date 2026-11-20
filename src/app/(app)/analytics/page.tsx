'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  Search,
  ArrowUpDown,
  TrendingUp,
  BarChart2,
  Sparkles,
  Shield,
  FileText,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAnalyticsOverview, getPages } from '@/lib/client-api'
import { Page } from '@/types/page'
import { toast } from 'sonner'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

function AnalyticsDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPageId = searchParams?.get('pageId') || 'all'

  // Filters state
  const [selectedPageId, setSelectedPageId] = useState<string>(initialPageId)
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('7d')
  const [selectedDevice, setSelectedDevice] = useState<string>('all')

  // Search & Sorting state for visitor logs
  const [logSearch, setLogSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'readTime' | 'scroll'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Data state
  const [pagesList, setPagesList] = useState<Page[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch user pages for dropdown
  useEffect(() => {
    getPages()
      .then((data) => setPagesList(data || []))
      .catch(() => {})
  }, [])

  // Sync selectedPageId if query param changes
  useEffect(() => {
    const pId = searchParams?.get('pageId')
    if (pId) setSelectedPageId(pId)
  }, [searchParams])

  // Fetch analytics overview
  const fetchAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const filters = {
        pageId: selectedPageId !== 'all' ? selectedPageId : undefined,
        dateRange,
        device: selectedDevice !== 'all' ? selectedDevice : undefined,
      }
      const res = await getAnalyticsOverview(filters)
      setAnalyticsData(res)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedPageId, dateRange, selectedDevice])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Format seconds to "Xm Ys" or "Xs"
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s'
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    if (m === 0) return `${s}s`
    if (s === 0) return `${m}m`
    return `${m}m ${s}s`
  }

  // Filter & sort visitor logs
  const filteredLogs = useMemo(() => {
    if (!analyticsData?.recentLogs) return []
    let logs = [...analyticsData.recentLogs]

    if (logSearch.trim()) {
      const q = logSearch.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.pageTitle?.toLowerCase().includes(q) ||
          l.referrer?.toLowerCase().includes(q) ||
          l.deviceType?.toLowerCase().includes(q) ||
          l.browser?.toLowerCase().includes(q) ||
          l.os?.toLowerCase().includes(q)
      )
    }

    logs.sort((a, b) => {
      let diff = 0
      if (sortBy === 'date') {
        diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'readTime') {
        diff = b.readTimeSeconds - a.readTimeSeconds
      } else if (sortBy === 'scroll') {
        diff = b.scrollDepthPercent - a.scrollDepthPercent
      }
      return sortOrder === 'asc' ? -diff : diff
    })

    return logs
  }, [analyticsData?.recentLogs, logSearch, sortBy, sortOrder])

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.info('No visitor data available to export')
      return
    }

    const headers = [
      'Document Title',
      'Slug',
      'Date & Time (UTC)',
      'Visitor Session',
      'Device',
      'Browser',
      'OS',
      'Referrer Source',
      'Read Time (Seconds)',
      'Max Scroll Depth (%)',
    ]

    const rows = filteredLogs.map((log) => [
      `"${(log.pageTitle || 'Untitled').replace(/"/g, '""')}"`,
      `"${log.pageSlug || ''}"`,
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${log.sessionId}"`,
      `"${log.deviceType || ''}"`,
      `"${log.browser || ''}"`,
      `"${log.os || ''}"`,
      `"${(log.referrer || '').replace(/"/g, '""')}"`,
      log.readTimeSeconds,
      log.scrollDepthPercent,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `notebase-analytics-${selectedPageId === 'all' ? 'all-pages' : selectedPageId}-${dateRange}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Analytics CSV exported successfully')
  }

  const summary = analyticsData?.summary || {
    totalViews: 0,
    uniqueVisitors: 0,
    totalReadTimeSeconds: 0,
    avgReadTimeSeconds: 0,
    completionRate: 0,
    totalComments: 0,
  }

  const timeseries = analyticsData?.timeseries || []
  const referrers = analyticsData?.referrers || []
  const devices = analyticsData?.devices || []
  const engagement = analyticsData?.engagement || []

  const selectedPageObj = pagesList.find((p) => p.id === selectedPageId)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-inter">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={22} />
              <span className="font-semibold text-xs tracking-tight">Notebase</span>
            </Link>
            <span className="text-muted-foreground text-xs hidden sm:inline">/</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Analytics & Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="h-8 text-xs font-medium gap-1.5 px-2.5 cursor-pointer"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 text-xs font-medium gap-1.5 px-2.5 cursor-pointer"
              title="Export analytics to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Page Title & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Reader Analytics</span>
              {selectedPageObj && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-[200px]">
                  {selectedPageObj.title}
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live metrics for page clicks, active reading duration, scroll depth, and audience sources.
            </p>
          </div>

          {/* Filters: Page selection, Date range, Device */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Page Filter Dropdown */}
            <Select
              value={selectedPageId}
              onValueChange={(val) => {
                setSelectedPageId(val)
                const newQuery = val !== 'all' ? `?pageId=${val}` : '/analytics'
                router.replace(`/analytics${val !== 'all' ? `?pageId=${val}` : ''}`)
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[170px] sm:w-[200px] bg-card">
                <SelectValue placeholder="All Pages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shared Documents</SelectItem>
                {pagesList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="truncate block max-w-[160px]">{p.title || 'Untitled'}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Selector */}
            <Select
              value={dateRange}
              onValueChange={(val: any) => setDateRange(val)}
            >
              <SelectTrigger className="h-8 text-xs w-[120px] bg-card">
                <Calendar className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Device Filter */}
            <Select
              value={selectedDevice}
              onValueChange={(val) => setSelectedDevice(val)}
            >
              <SelectTrigger className="h-8 text-xs w-[110px] bg-card">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Page Quick Actions (if specific page is selected) */}
        {selectedPageObj && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Active Note:</span>
              <span className="font-medium text-primary">{selectedPageObj.title}</span>
              <span className="text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground">
                {selectedPageObj.visibility}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/page/${selectedPageObj.id}`}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Edit Document</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              {selectedPageObj.visibility === 'public' && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <a
                    href={`/p/${selectedPageObj.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* 5 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Views */}
          <Card className="p-4 rounded-xl border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Views</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {summary.totalViews.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Visits recorded</p>
            </div>
          </Card>

          {/* 2. Unique Readers */}
          <Card className="p-4 rounded-xl border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Unique Readers</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {summary.uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Distinct visitor sessions</p>
            </div>
          </Card>

          {/* 3. Average Reading Duration */}
          <Card className="p-4 rounded-xl border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Avg. Read Time</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatDuration(summary.avgReadTimeSeconds)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active dwell reading</p>
            </div>
          </Card>

          {/* 4. Completion Rate */}
          <Card className="p-4 rounded-xl border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Completion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {summary.completionRate}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Read &gt;75% of content</p>
            </div>
          </Card>

          {/* 5. Live Comments Count */}
          <Card className="p-4 rounded-xl border-border bg-card shadow-sm space-y-2 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Discussion</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {summary.totalComments.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Reader feedback comments</p>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Traffic & Reads Trend Area Chart (Spans 2 cols) */}
          <Card className="p-5 rounded-xl border-border bg-card shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <span>Views & Engaged Readers Over Time</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Daily trends comparing raw visits against engaged reading sessions.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Engaged Reads</span>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              {isMounted && timeseries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="readsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="p-2.5 rounded-lg border border-border bg-popover shadow-md text-xs space-y-1">
                              <p className="font-semibold text-foreground">{data.date}</p>
                              <p className="text-primary flex items-center justify-between gap-3">
                                <span>Views:</span>
                                <span className="font-mono font-semibold">{data.views}</span>
                              </p>
                              <p className="text-emerald-500 flex items-center justify-between gap-3">
                                <span>Engaged Reads:</span>
                                <span className="font-mono font-semibold">{data.reads}</span>
                              </p>
                              {data.avgReadTime > 0 && (
                                <p className="text-muted-foreground flex items-center justify-between gap-3 pt-0.5 border-t border-border">
                                  <span>Avg Time:</span>
                                  <span className="font-mono">{formatDuration(data.avgReadTime)}</span>
                                </p>
                              )}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="var(--primary, #3b82f6)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#viewsGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="reads"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#readsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
                  <BarChart2 className="w-8 h-8 opacity-40 mb-2" />
                  <span>No traffic recorded in this timeframe yet.</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reading Engagement Depth Breakdown */}
          <Card className="p-5 rounded-xl border-border bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Reading Engagement Curve</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                How deeply visitors immerse in your document.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {engagement.map((item: any) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-muted-foreground font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Dwell duration pauses automatically when readers blur or switch tabs.</span>
            </div>
          </Card>
        </div>

        {/* Second Row: Referrer Traffic & Device Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traffic Sources & Referrers */}
          <Card className="p-5 rounded-xl border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span>Traffic & Referrer Sources</span>
                </h3>
                <p className="text-xs text-muted-foreground">Where your readers are discovering links.</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {referrers.length} sources
              </span>
            </div>

            <div className="space-y-2.5">
              {referrers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No external referral sources recorded yet.
                </div>
              ) : (
                referrers.slice(0, 6).map((ref: any) => (
                  <div
                    key={ref.name}
                    className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{ref.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-semibold text-foreground">{ref.count}</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">
                        {ref.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Device & Platform Distribution */}
          <Card className="p-5 rounded-xl border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span>Device & Screen Types</span>
                </h3>
                <p className="text-xs text-muted-foreground">Visitor distribution across hardware platforms.</p>
              </div>
            </div>

            <div className="space-y-3">
              {devices.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No device data collected yet.
                </div>
              ) : (
                devices.map((dev: any) => {
                  const isMobile = dev.name.toLowerCase() === 'mobile'
                  const isTablet = dev.name.toLowerCase() === 'tablet'
                  const Icon = isMobile ? Smartphone : isTablet ? Tablet : Monitor

                  return (
                    <div key={dev.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{dev.name}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {dev.count} ({dev.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${dev.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>

        {/* Visitor Activity Logs Table (with Search, Filter & Sorting) */}
        <Card className="p-5 rounded-xl border-border bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Visitor Activity Log</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {filteredLogs.length}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Detailed session history with dwell duration and scroll completion.
              </p>
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search title, source, device..."
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>

              <Select
                value={sortBy}
                onValueChange={(val: any) => setSortBy(val)}
              >
                <SelectTrigger className="h-8 text-xs w-[120px] bg-background">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="readTime">Read Time</SelectItem>
                  <SelectItem value="scroll">Scroll Depth</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                className="h-8 px-2 text-xs cursor-pointer"
                title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Traffic Referrer</th>
                  <th className="px-4 py-3">Device / Platform</th>
                  <th className="px-4 py-3">Read Time</th>
                  <th className="px-4 py-3">Scroll Depth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No visitor sessions match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{log.pageTitle || 'Untitled Page'}</span>
                          {log.pageSlug && (
                            <a
                              href={`/p/${log.pageSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-muted-foreground hover:text-primary shrink-0 ml-1"
                              title="Open public page"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{log.referrer}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <span className="capitalize">{log.deviceType}</span> • {log.browser} ({log.os})
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground whitespace-nowrap">
                        {formatDuration(log.readTimeSeconds)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${log.scrollDepthPercent}%` }}
                            />
                          </div>
                          <span className="font-mono text-muted-foreground">{log.scrollDepthPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default function AnalyticsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading analytics dashboard...</span>
          </div>
        </div>
      }
    >
      <AnalyticsDashboardContent />
    </Suspense>
  )
}
