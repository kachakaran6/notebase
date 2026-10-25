import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './db-schema'

const globalForDb = globalThis as unknown as { pool: mysql.Pool }

function getPoolConfig() {
  const rawUrl = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
  if (!rawUrl) {
    // Safe placeholder for build phase if env is momentarily omitted
    return {
      host: '127.0.0.1',
      port: 3306,
      user: 'notebase',
      password: '',
      database: 'notebase',
    }
  }

  try {
    const parsed = new URL(rawUrl)
    return {
      host: parsed.hostname || '127.0.0.1',
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username || 'notebase'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'notebase',
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
    return {
      uri: rawUrl,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10,
    }
  }
}

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