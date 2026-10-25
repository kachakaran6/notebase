import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './db-schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

const globalForDb = globalThis as unknown as { pool: mysql.Pool }

const pool = globalForDb.pool ?? mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DATABASE_URL.includes('sslmode=') || process.env.DATABASE_URL.includes('ssl=')
    ? { rejectUnauthorized: false }
    : undefined,
})

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