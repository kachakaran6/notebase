import { db } from './db'
import { sql } from 'drizzle-orm'

export async function initDb() {
  console.log('Initializing MySQL database tables safely...')
  try {
    // 1. Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 2. Create pages table
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

    // 3. Add additive columns to pages table safely if they do not exist
    try {
      const [colsResult]: any = await db.execute(sql`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'pages' 
          AND COLUMN_NAME IN ('is_analytics_enabled', 'is_comments_enabled');
      `)
      const rows = Array.isArray(colsResult) ? colsResult : []
      const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME || r.column_name))

      if (!existingCols.has('is_analytics_enabled')) {
        console.log('Adding is_analytics_enabled column to pages...')
        await db.execute(sql`
          ALTER TABLE pages ADD COLUMN is_analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE;
        `)
      }

      if (!existingCols.has('is_comments_enabled')) {
        console.log('Adding is_comments_enabled column to pages...')
        await db.execute(sql`
          ALTER TABLE pages ADD COLUMN is_comments_enabled BOOLEAN NOT NULL DEFAULT TRUE;
        `)
      }
    } catch (colErr) {
      console.warn('Note: columns may already exist or schema check fallback:', colErr)
    }

    // 4. Create share_links table
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

    // 5. Create page_analytics_events table (Isolated telemetry storage)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS page_analytics_events (
        id VARCHAR(36) PRIMARY KEY,
        page_id VARCHAR(36) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(32) NOT NULL DEFAULT 'view',
        read_time_seconds INT NOT NULL DEFAULT 0,
        scroll_depth_percent INT NOT NULL DEFAULT 0,
        referrer VARCHAR(512) NULL,
        device_type VARCHAR(32) NULL,
        browser VARCHAR(64) NULL,
        os VARCHAR(64) NULL,
        country VARCHAR(64) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_analytics_page_id (page_id),
        INDEX idx_analytics_session_id (session_id),
        INDEX idx_analytics_created_at (created_at),
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    // 6. Create page_comments table (Isolated live discussion storage)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS page_comments (
        id VARCHAR(36) PRIMARY KEY,
        page_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NULL,
        author_name VARCHAR(100) NOT NULL,
        author_email VARCHAR(255) NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        likes_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_comments_page_id (page_id),
        INDEX idx_comments_created_at (created_at),
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)

    console.log('MySQL Database tables initialized successfully with zero data loss guarantee!')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

if (process.argv[1] && process.argv[1].endsWith('init-db.ts')) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1))
}
