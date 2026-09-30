import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createPage, getPages, searchUserPages } from '@/lib/pages-api'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')

    let result
    if (query) {
      result = await searchUserPages(user.id, query)
    } else {
      result = await getPages(user.id)
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, content, icon, cover, template, visibility } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const page = await createPage(user.id, { title, content, icon, cover, template, visibility })
    return NextResponse.json({ data: page }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create page'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
