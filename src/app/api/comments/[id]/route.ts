import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { deleteComment, togglePinComment, likeComment } from '@/lib/comments-api'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteComment(id, user.id)

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete comment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'like') {
      const likesCount = await likeComment(id)
      return NextResponse.json({ data: { likesCount } })
    }

    if (action === 'pin') {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const isPinned = await togglePinComment(id, user.id)
      return NextResponse.json({ data: { isPinned } })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update comment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
