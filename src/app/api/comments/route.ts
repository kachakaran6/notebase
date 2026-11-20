import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createComment, getCommentsForPage } from '@/lib/comments-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId parameter is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const result = await getCommentsForPage(pageId, user?.id)

    return NextResponse.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, authorName, authorEmail, content } = body

    if (!pageId || !content) {
      return NextResponse.json({ error: 'pageId and content are required' }, { status: 400 })
    }

    const user = await getCurrentUser()

    const comment = await createComment({
      pageId,
      authorName: authorName || (user?.email ? user.email.split('@')[0] : 'Guest Reader'),
      authorEmail: authorEmail || user?.email || null,
      content,
      userId: user?.id || null,
    })

    return NextResponse.json({ data: comment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to post comment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
