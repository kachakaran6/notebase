import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './db-schema'

const globalForDb = globalThis as unknown as { pool: mysql.Pool }

// Parse any database URL format, stripping quotes or accidental 'DATABASE_URL=' prefix
function getPoolConfig() {
  const defaultHost = '130.210.3.108'
  const defaultUser = 'notebase'
  const defaultPass = 'Notebase@192e9444'
  const defaultDb = 'notebase'
  const defaultPort = 3306

  let raw = (process.env.DATABASE_URL || '').trim()

  // Remove potential double/single quotes and 'DATABASE_URL=' prefixes
  raw = raw.replace(/^[a-zA-Z0-9_]+=\s*/, '')
  raw = raw.replace(/^["']|["']$/g, '')
  raw = raw.replace(/^[a-zA-Z0-9_]+=\s*/, '')
  raw = raw.replace(/^["']|["']$/g, '').trim()

  if (!raw) {
    return {
      host: defaultHost,
      port: defaultPort,
      user: defaultUser,
      password: defaultPass,
      database: defaultDb,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
    }
  }

  // 1. Try standard URL parse
  try {
    const parsed = new URL(raw)
    return {
      host: parsed.hostname || defaultHost,
      port: Number(parsed.port) || defaultPort,
      user: parsed.username ? decodeURIComponent(parsed.username) : defaultUser,
      password: parsed.password ? decodeURIComponent(parsed.password) : defaultPass,
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : defaultDb,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    }
  } catch {
    // 2. Regex fallback: mysql://user:pass@host:port/database
    const match = raw.match(/mysql:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:\/]+)(?::(\d+))?(?:\/([^?#]+))?/)
    if (match) {
      return {
        user: match[1] ? decodeURIComponent(match[1]) : defaultUser,
        password: match[2] ? decodeURIComponent(match[2]) : defaultPass,
        host: match[3] || defaultHost,
        port: Number(match[4]) || defaultPort,
        database: match[5] || defaultDb,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 5,
        idleTimeout: 60000,
      }
    }

    // 3. Guaranteed safe fallback: never throw ERR_INVALID_URL
    return {
      host: defaultHost,
      port: defaultPort,
      user: defaultUser,
      password: defaultPass,
      database: defaultDb,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
    }
  }
}

// Always pass discrete config object so mysql2 NEVER parses strings or throws ERR_INVALID_URL
const pool = globalForDb.pool ?? mysql.createPool(getPoolConfig())

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema, mode: 'default' })

export { schema }

export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.query('SELECT 1')
    connection.release()
    console.log('Database connection successful')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    throw error
  }
}