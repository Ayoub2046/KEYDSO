import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required to run migrations.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('===> Starting Keydso Maanta Database Migrations...');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `);

    // 2. Discover migration files
    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    console.log(`Found ${files.length} migration file(s) in ${migrationsDir}`);

    // 3. Check already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations ORDER BY id ASC');
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version));

    let count = 0;
    for (const file of files) {
      const version = file.split('_')[0]; // e.g. "001"

      if (appliedSet.has(version)) {
        console.log(`[SKIPPED] ${file} (already applied)`);
        continue;
      }

      console.log(`[APPLYING] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Execute within transaction
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
          [version, file]
        );
        await client.query('COMMIT');
        console.log(`[SUCCESS] ${file} applied successfully.`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[FAILED] Error applying ${file}:`, err);
        throw err;
      }
    }

    console.log(`===> All migrations complete. ${count} new migration(s) applied.`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
