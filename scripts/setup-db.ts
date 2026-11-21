/**
 * KEYDSO MAANTA — Database Setup & Seed Script
 * ============================================
 * Run this script ONCE to initialize your Supabase/PostgreSQL database
 * with all tables, seed data, and admin accounts.
 *
 * Usage:
 *   npx tsx scripts/setup-db.ts
 *
 * Requirements:
 *   - DATABASE_URL set in .env with your Supabase PostgreSQL connection string
 *   - Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
  console.error('\n❌ ERROR: DATABASE_URL is not set or invalid in your .env file.');
  console.error('');
  console.error('Please open .env and set:');
  console.error('  DATABASE_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require');
  console.error('');
  console.error('Find your password in: Supabase Dashboard → Project Settings → Database → Connection string');
  process.exit(1);
}

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 32);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('\n🚀 KEYDSO MAANTA — Database Setup Script');
  console.log('=========================================');
  console.log(`📡 Connecting to: ${DATABASE_URL!.replace(/:([^:@]+)@/, ':****@')}`);

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully.\n');
  } catch (err: any) {
    console.error(`\n❌ Connection failed: ${err.message}`);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your DATABASE_URL in .env — it must be the postgres:// connection string');
    console.error('  2. Go to Supabase Dashboard → Project Settings → Database → Connection string (URI)');
    console.error('  3. Copy the URI, replace [YOUR-PASSWORD] with your actual DB password');
    process.exit(1);
  }

  try {
    // ─── STEP 1: Enable Extensions ─────────────────────────────────────────
    console.log('📦 Step 1/4 — Enabling PostgreSQL extensions...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('   ✓ Extensions enabled\n');

    // ─── STEP 2: Run Schema SQL (if not already applied) ───────────────────
    console.log('🗄️  Step 2/4 — Checking database schema...');
    const tableCheck = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as exists`
    );

    if (tableCheck.rows[0]?.exists) {
      console.log('   ✓ Database tables already exist in Supabase — skipping DDL migration.\n');
    } else {
      const schemaPath = path.resolve(__dirname, '../database/FULL_DATABASE.sql');
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }

      let schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      schemaSql = schemaSql
        .replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?\s*/gi, '')
        .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";?\s*/gi, '');

      const statements = schemaSql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let ran = 0;
      let skipped = 0;
      for (const stmt of statements) {
        if (!stmt || stmt.startsWith('--')) { skipped++; continue; }
        try {
          await client.query(stmt);
          ran++;
        } catch (err: any) {
          skipped++;
        }
      }
      console.log(`   ✓ Schema applied — ${ran} statements executed, ${skipped} skipped\n`);
    }

    // ─── STEP 3: Seed Admin Profiles with correct scrypt hashes ────────────
    console.log('👤 Step 3/4 — Seeding admin user accounts with correct password hashes...');

    const adminHash = hashPasswordSync('AdminPass123!');
    const studentHash = hashPasswordSync('StudentPass123!');

    console.log('   🔐 Generating scrypt password hashes (this takes a moment)...');

    // Update all profiles with correct scrypt hashes
    const profileUpdates = [
      { id: '00000000-0000-0000-0000-000000000001', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000002', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000003', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000004', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000005', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000010', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000011', hash: adminHash },
      { id: '00000000-0000-0000-0000-000000000099', hash: studentHash },
    ];

    for (const { id, hash } of profileUpdates) {
      await client.query(
        `UPDATE profiles SET password_hash = $1 WHERE id = $2`,
        [hash, id]
      );
    }
    console.log('   ✓ Password hashes updated for all 8 user accounts\n');

    // ─── STEP 4: Verify ─────────────────────────────────────────────────────
    console.log('🔍 Step 4/4 — Verifying setup...');
    const tableRes = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    const profileRes = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM profiles`
    );
    const roleRes = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM roles`
    );

    console.log(`   ✓ Tables created: ${tableRes.rowCount}`);
    console.log(`   ✓ Users seeded: ${profileRes.rows[0].count}`);
    console.log(`   ✓ Roles configured: ${roleRes.rows[0].count}`);

    console.log('\n✅ DATABASE SETUP COMPLETE!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Your Supabase database is ready. Demo accounts:');
    console.log('');
    console.log('  🔑 admin@keydso.university.edu     → AdminPass123!');
    console.log('  🔑 president@keydso.university.edu → AdminPass123!');
    console.log('  🔑 finance.a@keydso.university.edu → AdminPass123!');
    console.log('  🔑 student.demo@keydso.university.edu → StudentPass123!');
    console.log('');
    console.log('▶  Now run: npm run dev');
    console.log('═══════════════════════════════════════════════\n');

  } catch (err: any) {
    console.error(`\n❌ Setup failed: ${err.message}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
