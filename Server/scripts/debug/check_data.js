const pool = require('../../db');

async function checkData() {
  const deptId = 68;
  try {
    const mpd = await pool.query('SELECT * FROM master_program_departments WHERE department_id = $1', [deptId]);
    console.log('--- master_program_departments for 68 ---');
    console.table(mpd.rows);

    if (mpd.rows.length > 0) {
      const pIds = mpd.rows.map(r => r.program_id);
      const programs = await pool.query('SELECT id, name FROM master_programs WHERE id = ANY($1)', [pIds]);
      console.log('--- Matching programs in master_programs ---');
      console.table(programs.rows);
    }

    const msd = await pool.query('SELECT * FROM master_subject_departments WHERE department_id = $1', [deptId]);
    console.log('--- master_subject_departments for 68 ---');
    console.table(msd.rows);

    if (msd.rows.length > 0) {
      const sIds = msd.rows.map(r => r.subject_id);
      const subjects = await pool.query('SELECT id, name FROM master_subjects WHERE id = ANY($1)', [sIds]);
      console.log('--- Matching subjects in master_subjects ---');
      console.table(subjects.rows);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkData();
