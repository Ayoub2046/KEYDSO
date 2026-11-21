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

const STUDENTS_LIST = [
  { name: 'Abdiaziz Mohamed Mohamed', id: 'CIS231433' },
  { name: 'Abdifitah abdullahi salah', id: 'CIS221714' },
  { name: 'Abdifitah Ahmed Mohamed', id: 'CIS241382' },
  { name: 'abdifitah hassan mohamed', id: 'CIS231698' },
  { name: 'abdifitah mustaf ibrahim', id: 'CIS231703' },
  { name: 'abdimajid hassan ibrahim', id: 'CIS231436' },
  { name: 'Abdirahin hussein mohamed', id: 'CIS231437' },
  { name: 'abdirahman abdi mohamed', id: 'CIS2314399' },
  { name: 'abdirahman idirs ibrahim', id: 'CIS231441' },
  { name: 'abdisamed isack ali', id: 'CIS231621' },
  { name: 'abdiwahid hassan mohamed', id: 'CIS231444' },
  { name: 'Abdiwali aydid ali', id: 'CIS231445' },
  { name: 'abdukadir ali mohamed bule', id: 'CIS231434' },
  { name: 'abdullahi abdukadir ali', id: 'CIS231447' },
  { name: 'Abdullahi dahir abdullahi', id: 'CIS231645' },
  { name: 'abdullahi mohamed ali', id: 'CIS231449' },
  { name: 'Abdullahi Mohamed Hassan', id: 'CIS2314533' },
  { name: 'abdullahi salad mohamed', id: 'CIS231482' },
  { name: 'Adil Muhsin Ahmed', id: 'CIS231432' },
  { name: 'Ashia Mohamed Ibrahim', id: 'CIS231457' },
  { name: 'Ayub Adan Abdi', id: 'CIS231660' },
  { name: 'Bashir Adan Ali', id: 'CIS231455' },
  { name: 'Derow Abdi Adan Huusein', id: 'CIS231458' },
  { name: 'Feysal Abdirizaq Abdi', id: 'CIS241377' },
  { name: 'hanaad jamal adan', id: 'CIS231622' },
  { name: 'Ibrahim Abdullahi Ibrahim', id: 'CIS231461' },
  { name: 'Ibrahim Adam Mukhtar', id: 'CIS221737' },
  { name: 'ibrahim ali hassan', id: 'CIS231642' },
  { name: 'ibrahim mustafa mohamed', id: 'CIS231462' },
  { name: 'ismail ibrahim abdirahman', id: 'CIS231463' },
  { name: 'mahad abdihamid abdullahi', id: 'CIS231646' },
  { name: 'mohamed abdinor mohamed', id: 'CIS231467' },
  { name: 'mohamed abdirahman ahmed', id: 'CIS231661' },
  { name: 'mohamed adan barow', id: 'CIS231469' }
];

async function seedStudents() {
  const client = await pool.connect();
  try {
    console.log(`Starting import of ${STUDENTS_LIST.length} students from Excel sheet...`);

    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'STUDENT'");
    const studentRoleId = roleRes.rows[0]?.id;

    const facultyId = '30000000-0000-0000-0000-000000000002'; // CSIT
    const departmentId = '40000000-0000-0000-0000-000000000001'; // CS
    const classId = '50000000-0000-0000-0000-000000000001';
    const academicYearId = '20000000-0000-0000-0000-000000000001';
    const campaignId = '70000000-0000-0000-0000-000000000001';

    let successCount = 0;

    for (const item of STUDENTS_LIST) {
      const studentIdNum = item.id.trim();
      const studentName = item.name.trim();
      const email = `${studentIdNum.toLowerCase()}@student.university.edu`;
      // Hash password using their exact student ID
      const passHash = hashPasswordSync(studentIdNum);

      // 1. Insert or update student
      const stuRes = await client.query(
        `INSERT INTO students (
          student_id_number, full_name, faculty_id, department_id, class_id, academic_year_id,
          enrollment_status, contact_number, email
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8)
        ON CONFLICT (student_id_number) DO UPDATE
        SET full_name = EXCLUDED.full_name, email = EXCLUDED.email
        RETURNING id`,
        [studentIdNum, studentName, facultyId, departmentId, classId, academicYearId, '+252 61 5000000', email]
      );
      const studentDbId = stuRes.rows[0].id;

      // 2. Insert or update profile
      const profRes = await client.query(
        `INSERT INTO profiles (
          email, password_hash, full_name, contact_number, is_active, student_id
        ) VALUES ($1, $2, $3, $4, true, $5)
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            student_id = EXCLUDED.student_id,
            is_active = true
        RETURNING id`,
        [email, passHash, studentName, '+252 61 5000000', studentDbId]
      );
      const profileId = profRes.rows[0].id;

      // 3. Assign STUDENT role
      if (studentRoleId) {
        await client.query(
          `INSERT INTO user_role_assignments (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [profileId, studentRoleId]
        );
      }

      // 4. Create contribution obligation
      await client.query(
        `INSERT INTO contribution_obligations (
          student_id, campaign_id, expected_amount, verified_paid_amount, waived_amount, sponsored_amount, status
        ) VALUES ($1, $2, 25.00, 0.00, 0.00, 0.00, 'DUE')
        ON CONFLICT (student_id, campaign_id) DO NOTHING`,
        [studentDbId, campaignId]
      );

      successCount++;
      console.log(`[${successCount}/${STUDENTS_LIST.length}] Processed: ${studentIdNum} - ${studentName}`);
    }

    console.log(`\n🎉 Successfully imported all ${successCount} students into the database!`);
    console.log(`Every student's password is set to their Student ID (e.g. ID: CIS231433, Password: CIS231433 or cis231433).`);
  } finally {
    client.release();
    await pool.end();
  }
}

seedStudents().catch((err) => {
  console.error('Failed to seed students:', err);
  process.exit(1);
});
