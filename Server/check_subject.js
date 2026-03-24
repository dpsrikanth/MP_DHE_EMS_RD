const pool = require('./db');

async function checkSubject() {
  try {
    const res = await pool.query("SELECT id, name, teacher_id, program_id FROM master_subjects WHERE name ILIKE '%Python%'");
    console.log('--- Python in master_subjects ---');
    console.table(res.rows);

    if (res.rows.length > 0) {
      const tId = res.rows[0].teacher_id;
      const user = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [tId]);
      console.log(`--- Teacher for Python (ID: ${tId}) ---`);
      console.table(user.rows);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkSubject();
