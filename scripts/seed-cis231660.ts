import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 32);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  const client = await pool.connect();
  try {
    const studentIdNumber = 'cis231660';
    const email = 'cis231660@student.university.edu';
    const fullName = 'Ahmed Dahir Nur (cis231660)';
    const passHash = hashPasswordSync('cis231660');

    console.log('Seeding student cis231660 into Supabase...');

    // 1. Student record
    const existingStu = await client.query('SELECT id FROM students WHERE LOWER(student_id_number) = $1', [studentIdNumber.toLowerCase()]);
    let stuId: string;
    if (existingStu.rows.length > 0) {
      stuId = existingStu.rows[0].id;
      console.log('Student record exists with ID:', stuId);
    } else {
      const res = await client.query(
        `INSERT INTO students (
          student_id_number, full_name, faculty_id, department_id, class_id, academic_year_id,
          enrollment_status, contact_number, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          studentIdNumber,
          fullName,
          '30000000-0000-0000-0000-000000000002',
          '40000000-0000-0000-0000-000000000001',
          '50000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001',
          'ACTIVE',
          '+252 61 2316600',
          email
        ]
      );
      stuId = res.rows[0].id;
      console.log('Created student record with ID:', stuId);
    }

    // 2. Profile record
    const existingProf = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1 OR student_id = $2', [email.toLowerCase(), stuId]);
    let profId: string;
    if (existingProf.rows.length > 0) {
      profId = existingProf.rows[0].id;
      await client.query('UPDATE profiles SET password_hash = $1, student_id = $2, full_name = $3 WHERE id = $4', [passHash, stuId, fullName, profId]);
      console.log('Updated profile with ID:', profId);
    } else {
      const res = await client.query(
        `INSERT INTO profiles (
          email, password_hash, full_name, contact_number, is_active, student_id
        ) VALUES ($1, $2, $3, $4, true, $5) RETURNING id`,
        [email, passHash, fullName, '+252 61 2316600', stuId]
      );
      profId = res.rows[0].id;
      console.log('Created profile with ID:', profId);
    }

    // 3. User Role Assignment
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'STUDENT'");
    if (roleRes.rows[0]) {
      const roleId = roleRes.rows[0].id;
      await client.query(
        `INSERT INTO user_role_assignments (user_id, role_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [profId, roleId]
      );
      console.log('Assigned STUDENT role.');
    }

    // 4. Contribution obligation
    await client.query(
      `INSERT INTO contribution_obligations (
        student_id, campaign_id, expected_amount, verified_paid_amount, waived_amount, sponsored_amount, status
      ) VALUES ($1, $2, 25.00, 0.00, 0.00, 0.00, 'DUE')
      ON CONFLICT (student_id, campaign_id) DO NOTHING`,
      [stuId, '70000000-0000-0000-0000-000000000001']
    );
    console.log('Assigned contribution obligation.');

    console.log('\n✅ Student cis231660 successfully created!');
    console.log('Student ID: cis231660');
    console.log('Default Password: cis231660');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
