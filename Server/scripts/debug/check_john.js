const pool = require('../../db');

async function checkJohn() {
  const johnId = 15;
  try {
    const ms = await pool.query('SELECT id, name, program_id FROM master_subjects WHERE teacher_id = $1', [johnId]);
    console.log('--- John in master_subjects ---');
    console.table(ms.rows);

    const fs = await pool.query(`
      SELECT fs.id, s.name as subject_name, s.program_id 
      FROM faculty_subjects fs
      JOIN master_subjects s ON fs.subject_id = s.id
      WHERE fs.teacher_id = $1
    `, [johnId]);
    console.log('--- John in faculty_subjects ---');
    console.table(fs.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkJohn();
