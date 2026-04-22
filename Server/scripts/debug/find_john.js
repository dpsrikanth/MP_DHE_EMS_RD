const pool = require('../../db');

async function findJohn() {
  try {
    const res = await pool.query("SELECT id, name, email FROM users WHERE name ILIKE '%john%'");
    console.log('--- Users matching John ---');
    console.table(res.rows);

    const subs = await pool.query("SELECT id, name, teacher_id FROM master_subjects WHERE name ILIKE '%Python%'");
    console.log('--- Python Subjects ---');
    console.table(subs.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

findJohn();
