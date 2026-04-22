const pool = require('../../db');

async function checkTeachers() {
  try {
    const res = await pool.query(`
      SELECT u.id, u.name, u.email, mt.department_id, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN master_teachers mt ON u.id = mt.user_id
      WHERE mt.department_id = 68 OR u.name ILIKE '%john%' OR u.name ILIKE '%krishna%' OR u.name ILIKE '%joseph%'
    `);
    console.log('--- Relevant Users ---');
    console.table(res.rows);

    const subs = await pool.query(`
      SELECT s.id, s.name, s.teacher_id, s.program_id 
      FROM master_subjects s
      WHERE s.teacher_id IN (SELECT id FROM users WHERE name ILIKE '%john%' OR name ILIKE '%krishna%' OR name ILIKE '%joseph%')
    `);
    console.log('--- Their Subjects ---');
    console.table(subs.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkTeachers();
