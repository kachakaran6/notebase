import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from './db'
import { users } from './db-schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'internet-notebook-secret-key-change-in-production'
const JWT_EXPIRY = '7d'
const COOKIE_NAME = 'auth_token'

export interface SessionUser {
  id: string
  email: string
}

// Sign a JWT token
async function signToken(payload: SessionUser): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret)
}

// Verify a JWT token
async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return { id: payload.id as string, email: payload.email as string }
  } catch {
    return null
  }
}

// Get the current session user from cookies (server-side)
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await verifyToken(token)
  } catch {
    return null
  }
}

// Sign in: verify credentials, set cookie
export async function signIn(email: string, password: string): Promise<SessionUser> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (!user) {
    throw new Error('Invalid email or password')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new Error('Invalid email or password')
  }

  const sessionUser: SessionUser = { id: user.id, email: user.email }
  const token = await signToken(sessionUser)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return sessionUser
}

// Sign up: create user, set cookie
export async function signUp(email: string, password: string): Promise<SessionUser> {
  const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (existing.length > 0) {
    throw new Error('An account with this email already exists')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
  }).returning()

  const sessionUser: SessionUser = { id: newUser.id, email: newUser.email }
  const token = await signToken(sessionUser)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return sessionUser
}

// Sign out: clear cookie
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Require authentication: redirect to login if not authenticated
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}