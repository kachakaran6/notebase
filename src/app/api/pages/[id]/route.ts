import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPageById, updatePage, deletePage, duplicatePage } from '@/lib/pages-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const page = await getPageById(id, user.id)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    return NextResponse.json({ data: page })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const page = await updatePage(id, user.id, body)
    return NextResponse.json({ data: page })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await deletePage(id, user.id)

    return NextResponse.json({ message: 'Page deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
