import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createShareLink, getShareLinks, revokeShareLink } from '@/lib/pages-api'

// Create a share link
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { pageId, expiresAt } = body

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const token = await createShareLink(pageId, user.id, expiresAt ? new Date(expiresAt) : undefined)
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/s/${token}`

    return NextResponse.json({ data: { token, shareUrl } }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create share link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Get share links for a page
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const links = await getShareLinks(pageId, user.id)
    return NextResponse.json({ data: links })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch share links'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Revoke a share link
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    await revokeShareLink(token, user.id)
    return NextResponse.json({ message: 'Share link revoked' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke share link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
