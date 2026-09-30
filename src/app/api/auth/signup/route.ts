import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const user = await signUp(email, password)
    return NextResponse.json({ data: user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create account'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
