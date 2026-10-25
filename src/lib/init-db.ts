import { db } from './db'
import { sql } from 'drizzle-orm'

export async function initDb() {
  console.log('Initializing MySQL database tables...')
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create pages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content MEDIUMTEXT,
        icon VARCHAR(100),
        cover VARCHAR(255),
        template ENUM('blank', 'notes', 'checklist', 'prompt', 'project', 'meeting') NOT NULL DEFAULT 'blank',
        visibility ENUM('private', 'unlisted', 'public') NOT NULL DEFAULT 'private',
        font VARCHAR(50) DEFAULT 'inter',
        background VARCHAR(50) DEFAULT 'default',
        accent VARCHAR(50) DEFAULT 'blue',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // Create share_links table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS share_links (
        id VARCHAR(36) PRIMARY KEY,
        page_id VARCHAR(36) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NULL,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    console.log('MySQL Database tables initialized successfully!')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

if (process.argv[1] && process.argv[1].endsWith('init-db.ts')) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1))
}
