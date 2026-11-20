'use client'

import { useEffect, useRef } from 'react'

interface AnalyticsTrackerProps {
  pageId: string
  isAnalyticsEnabled?: boolean
}

export function AnalyticsTracker({ pageId, isAnalyticsEnabled = true }: AnalyticsTrackerProps) {
  const activeSecondsRef = useRef(0)
  const maxScrollRef = useRef(0)
  const sessionIdRef = useRef<string>('')
  const hasSentInitialRef = useRef(false)

  useEffect(() => {
    // If owner disabled analytics for this page, completely bail out
    if (!isAnalyticsEnabled || !pageId) return

    // 1. Get or generate anonymous session id for this page visit
    const storageKey = `nb_sess_${pageId}`
    let sid = ''
    try {
      sid = sessionStorage.getItem(storageKey) || ''
      if (!sid) {
        sid = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
        sessionStorage.setItem(storageKey, sid)
      }
    } catch {
      sid = `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
    }
    sessionIdRef.current = sid

    // 2. Detect client device, browser, and os
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    let deviceType = 'desktop'
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      deviceType = 'tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua) || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      deviceType = 'mobile'
    }

    let browser = 'Other'
    if (ua.includes('Edg/')) browser = 'Edge'
    else if (ua.includes('Chrome/')) browser = 'Chrome'
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
    else if (ua.includes('Firefox/')) browser = 'Firefox'

    let os = 'Other'
    if (ua.includes('Win')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    else if (ua.includes('Linux')) os = 'Linux'

    const referrer = typeof document !== 'undefined' ? document.referrer : ''

    const sendTelemetry = (eventType: 'view' | 'heartbeat' | 'leave') => {
      const payload = {
        pageId,
        sessionId: sessionIdRef.current,
        eventType,
        readTimeSeconds: activeSecondsRef.current,
        scrollDepthPercent: maxScrollRef.current,
        referrer,
        deviceType,
        browser,
        os,
      }

      const body = JSON.stringify(payload)
      if (typeof navigator !== 'undefined' && eventType === 'leave' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/analytics/track', blob)
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {
          // Silent catch for telemetry
        })
      }
    }

    // 3. Send initial view if not yet sent
    if (!hasSentInitialRef.current) {
      hasSentInitialRef.current = true
      sendTelemetry('view')
    }

    // 4. Track scroll depth
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const current = Math.min(100, Math.round((window.scrollY / totalHeight) * 100))
        if (current > maxScrollRef.current) {
          maxScrollRef.current = current
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial calculation

    // 5. Active read dwell timer (only increments when tab is active and visible)
    let isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const timer = setInterval(() => {
      if (isVisible) {
        activeSecondsRef.current += 1

        // Heartbeat milestones: 5s, 15s, 30s, 60s, 120s, and every 60s thereafter
        const s = activeSecondsRef.current
        if (s === 5 || s === 15 || s === 30 || s === 60 || s === 120 || (s > 120 && s % 60 === 0)) {
          sendTelemetry('heartbeat')
        }
      }
    }, 1000)

    // 6. Cleanup on unmount or tab close
    const handleUnload = () => {
      sendTelemetry('leave')
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(timer)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleUnload)
      sendTelemetry('leave')
    }
  }, [pageId, isAnalyticsEnabled])

  return null
}
