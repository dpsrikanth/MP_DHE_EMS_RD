const pool = require('../db');

async function check() {
  try {
    console.log('Querying calculated_internal_marks...');
    const res = await pool.query('SELECT * FROM calculated_internal_marks LIMIT 10');
    console.log('RESULT:', JSON.stringify(res.rows, null, 2));
    
    console.log('\nQuerying marks table sample...');
    const res2 = await pool.query('SELECT student_id, subject_id, internal_marks, external_marks FROM marks WHERE external_marks > 0 LIMIT 10');
    console.log('MARKS SAMPLE:', JSON.stringify(res2.rows, null, 2));

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
    console.log('Pool closed');
    process.exit(0);
  }
}

check();

