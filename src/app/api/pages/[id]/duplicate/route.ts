import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { duplicatePage } from '@/lib/pages-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const page = await duplicatePage(id, user.id)
    return NextResponse.json({ data: page }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
