const pool = require('../../db');

async function debugJoins() {
  const deptId = 68;
  try {
    const q1 = await pool.query('SELECT count(*) FROM master_subjects s JOIN master_subject_departments msd ON s.id = msd.subject_id WHERE msd.department_id = $1', [deptId]);
    console.log('Subjects joined count:', q1.rows[0].count);

    const q2 = await pool.query('SELECT count(*) FROM master_programs p JOIN master_program_departments mpd ON p.id = mpd.program_id WHERE mpd.department_id = $1', [deptId]);
    console.log('Programs joined count:', q2.rows[0].count);

    const q3 = await pool.query(`
      SELECT count(*) 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN master_teachers mt ON u.id = mt.user_id
      WHERE mt.department_id = $1
      AND (r.role_name ILIKE '%faculty%' OR r.role_name ILIKE '%teacher%' OR r.role_name ILIKE 'HOD')
    `, [deptId]);
    console.log('Faculties joined count:', q3.rows[0].count);

    // Check chiefs
    const q4 = await pool.query(`
      SELECT count(*) 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name IN ('admin', 'SUPER_ADMIN', 'college_admin', 'HOD')
    `);
    console.log('Total potential chiefs count:', q4.rows[0].count);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

debugJoins();
