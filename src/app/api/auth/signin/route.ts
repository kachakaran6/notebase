import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await signIn(email, password)
    return NextResponse.json({ data: user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
