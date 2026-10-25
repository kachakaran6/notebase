import fs from 'fs'
import mysql from 'mysql2/promise'

/**
 * Migration Script: PostgreSQL -> MySQL
 * Reads exported data and loads into MySQL.
 */
export async function migrateToMySQL(dbConfig) {
  const backupFile = './scripts/backup_data.json'
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file ${backupFile} not found!`)
  }
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))
  const { users, pages, shareLinks } = data

  console.log(`\nConnecting to MySQL at ${dbConfig.host}:${dbConfig.port || 3306}...`)

  let rootConn
  try {
    rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: Number(dbConfig.port) || 3306,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: { rejectUnauthorized: false }
    })
  } catch (sslErr) {
    console.log('SSL connect attempt failed, trying non-SSL...', sslErr.message)
    rootConn = await mysql.createConnection({
      host: dbConfig.host,
      port: Number(dbConfig.port) || 3306,
      user: dbConfig.user,
      password: dbConfig.password,
    })
  }

  const databaseName = dbConfig.database || 'notebase'
  console.log(`Ensuring database \`${databaseName}\` exists...`)
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
  await rootConn.end()

  // Connect to the specific database
  let connection
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: Number(dbConfig.port) || 3306,
      user: dbConfig.user,
      password: dbConfig.password,
      database: databaseName,
      ssl: { rejectUnauthorized: false }
    })
  } catch {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: Number(dbConfig.port) || 3306,
      user: dbConfig.user,
      password: dbConfig.password,
      database: databaseName,
    })
  }

  console.log('Connected to MySQL database. Creating schema...')

  // 1. Create tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`password_hash\` VARCHAR(255) NOT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`pages\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`user_id\` VARCHAR(36) NOT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(255) NOT NULL UNIQUE,
      \`content\` MEDIUMTEXT,
      \`icon\` VARCHAR(100),
      \`cover\` VARCHAR(255),
      \`template\` ENUM('blank', 'notes', 'checklist', 'prompt', 'project', 'meeting') NOT NULL DEFAULT 'blank',
      \`visibility\` ENUM('private', 'unlisted', 'public') NOT NULL DEFAULT 'private',
      \`font\` VARCHAR(50) DEFAULT 'inter',
      \`background\` VARCHAR(50) DEFAULT 'default',
      \`accent\` VARCHAR(50) DEFAULT 'blue',
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_pages_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`share_links\` (
      \`id\` VARCHAR(36) PRIMARY KEY,
      \`page_id\` VARCHAR(36) NOT NULL,
      \`token\` VARCHAR(64) NOT NULL UNIQUE,
      \`expires_at\` TIMESTAMP NULL,
      \`is_revoked\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_share_links_page\` FOREIGN KEY (\`page_id\`) REFERENCES \`pages\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  console.log('Schema created successfully.')

  // Disable foreign keys temporarily for clean insertion
  await connection.query('SET FOREIGN_KEY_CHECKS = 0;')
  await connection.query('TRUNCATE TABLE `share_links`;')
  await connection.query('TRUNCATE TABLE `pages`;')
  await connection.query('TRUNCATE TABLE `users`;')
  await connection.query('SET FOREIGN_KEY_CHECKS = 1;')

  // 2. Insert Users
  if (users?.length > 0) {
    console.log(`Migrating ${users.length} users...`)
    for (const u of users) {
      const createdAt = new Date(u.created_at).toISOString().slice(0, 19).replace('T', ' ')
      const updatedAt = new Date(u.updated_at).toISOString().slice(0, 19).replace('T', ' ')
      await connection.query(
        'INSERT INTO `users` (`id`, `email`, `password_hash`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);',
        [u.id, u.email, u.password_hash, createdAt, updatedAt]
      )
    }
  }

  // 3. Insert Pages
  if (pages?.length > 0) {
    console.log(`Migrating ${pages.length} pages...`)
    for (const p of pages) {
      const createdAt = new Date(p.created_at).toISOString().slice(0, 19).replace('T', ' ')
      const updatedAt = new Date(p.updated_at).toISOString().slice(0, 19).replace('T', ' ')
      await connection.query(
        `INSERT INTO \`pages\` (
          \`id\`, \`user_id\`, \`title\`, \`slug\`, \`content\`, \`icon\`, \`cover\`,
          \`template\`, \`visibility\`, \`font\`, \`background\`, \`accent\`,
          \`created_at\`, \`updated_at\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`);`,
        [
          p.id,
          p.user_id,
          p.title,
          p.slug,
          p.content,
          p.icon,
          p.cover,
          p.template || 'blank',
          p.visibility || 'private',
          p.font || 'inter',
          p.background || 'default',
          p.accent || 'blue',
          createdAt,
          updatedAt
        ]
      )
    }
  }

  // 4. Insert Share Links
  if (shareLinks?.length > 0) {
    console.log(`Migrating ${shareLinks.length} share links...`)
    for (const sl of shareLinks) {
      const createdAt = new Date(sl.created_at).toISOString().slice(0, 19).replace('T', ' ')
      const expiresAt = sl.expires_at ? new Date(sl.expires_at).toISOString().slice(0, 19).replace('T', ' ') : null
      await connection.query(
        'INSERT INTO `share_links` (`id`, `page_id`, `token`, `expires_at`, `is_revoked`, `created_at`) VALUES (?, ?, ?, ?, ?, ?);',
        [sl.id, sl.page_id, sl.token, expiresAt, sl.is_revoked ? 1 : 0, createdAt]
      )
    }
  }

  // 5. Verification
  const [userCount] = await connection.query('SELECT count(*) as count FROM `users`;')
  const [pageCount] = await connection.query('SELECT count(*) as count FROM `pages`;')
  const [linkCount] = await connection.query('SELECT count(*) as count FROM `share_links`;')

  console.log('\n--- Migration Verification ---')
  console.log(`Users migrated: ${userCount[0].count} / ${users.length}`)
  console.log(`Pages migrated: ${pageCount[0].count} / ${pages.length}`)
  console.log(`Share links migrated: ${linkCount[0].count} / ${shareLinks.length}`)

  await connection.end()
  console.log('\nMigration to MySQL completed successfully!')
}

// Direct execution from CLI if called with arguments or env
if (process.argv[1]?.includes('migrate_to_mysql.mjs')) {
  const host = process.env.MYSQL_HOST || process.argv[2]
  const user = process.env.MYSQL_USER || process.argv[3]
  const password = process.env.MYSQL_PASSWORD || process.argv[4]
  const database = process.env.MYSQL_DATABASE || process.argv[5] || 'notebase'
  const port = Number(process.env.MYSQL_PORT || process.argv[6] || 3306)

  if (!host || !user || !password) {
    console.error('Usage: node scripts/migrate_to_mysql.mjs <host> <user> <password> [database] [port]')
    process.exit(1)
  }

  migrateToMySQL({ host, user, password, database, port })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
