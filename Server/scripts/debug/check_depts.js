const pool = require('../../db');

async function checkDepts() {
  try {
    const depts = await pool.query("SELECT id, department_name FROM master_departments WHERE department_name ILIKE '%Computer%'");
    console.log('--- Computer Departments ---');
    console.table(depts.rows);

    if (depts.rows.length > 0) {
      const deptId = depts.rows[0].id;
      const teachers = await pool.query(`
        SELECT u.id, u.name, u.email, mt.department_id
        FROM users u
        JOIN master_teachers mt ON u.id = mt.user_id
        WHERE mt.department_id = $1
      `, [deptId]);
      console.log(`--- Teachers in Dept ${deptId} ---`);
      console.table(teachers.rows);

      const subjects = await pool.query(`
        SELECT s.id, s.name, s.program_id, p.name as program_name
        FROM master_subjects s
        JOIN master_programs p ON s.program_id = p.id
        JOIN master_subject_departments msd ON s.id = msd.subject_id
        WHERE msd.department_id = $1
      `, [deptId]);
      console.log(`--- Subjects in Dept ${deptId} ---`);
      console.table(subjects.rows);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkDepts();
