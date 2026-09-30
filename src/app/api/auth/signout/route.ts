import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await signOut()
    return NextResponse.json({ message: 'Signed out successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
  }
}
