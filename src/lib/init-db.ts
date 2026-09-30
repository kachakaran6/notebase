import { db } from './db'
import { sql } from 'drizzle-orm'

export async function initDb() {
  console.log('Initializing database tables...')
  try {
    // Create enums if not exists
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE visibility AS ENUM ('private', 'unlisted', 'public');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE template AS ENUM ('blank', 'notes', 'checklist', 'prompt', 'project', 'meeting');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create pages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content TEXT,
        icon VARCHAR(100),
        cover VARCHAR(255),
        template template NOT NULL DEFAULT 'blank',
        visibility visibility NOT NULL DEFAULT 'private',
        font VARCHAR(50) DEFAULT 'inter',
        background VARCHAR(50) DEFAULT 'default',
        accent VARCHAR(50) DEFAULT 'blue',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    // Create share_links table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS share_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)

    console.log('Database initialized successfully!')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

if (process.argv[1] && process.argv[1].endsWith('init-db.ts')) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1))
}
