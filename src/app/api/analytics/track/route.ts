import { NextRequest, NextResponse } from 'next/server'
import { recordAnalyticsEvent } from '@/lib/analytics-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pageId,
      sessionId,
      eventType = 'view',
      readTimeSeconds = 0,
      scrollDepthPercent = 0,
      referrer,
      deviceType,
      browser,
      os,
    } = body

    if (!pageId || !sessionId) {
      return NextResponse.json({ error: 'pageId and sessionId are required' }, { status: 400 })
    }

    // Best-effort user-agent detection fallback if not passed from client
    const userAgent = request.headers.get('user-agent') || ''
    let detectedDevice = deviceType
    if (!detectedDevice) {
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        detectedDevice = 'tablet'
      } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
        detectedDevice = 'mobile'
      } else {
        detectedDevice = 'desktop'
      }
    }

    const result = await recordAnalyticsEvent({
      pageId,
      sessionId,
      eventType,
      readTimeSeconds,
      scrollDepthPercent,
      referrer,
      deviceType: detectedDevice,
      browser,
      os,
    })

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record analytics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
