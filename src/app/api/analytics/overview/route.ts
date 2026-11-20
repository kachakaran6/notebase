import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getAnalyticsOverview, AnalyticsFilters } from '@/lib/analytics-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId') || undefined
    const dateRange = (searchParams.get('dateRange') || '7d') as AnalyticsFilters['dateRange']
    const device = searchParams.get('device') || undefined

    const overview = await getAnalyticsOverview(user.id, {
      pageId,
      dateRange,
      device,
    })

    return NextResponse.json({ data: overview })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics overview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
