const pool = require('../db');

async function test() {
  try {
    const subject_id = 11;
    const exam_id = 45;
    const setter_id = 1; // Assuming typical user id
    console.log('Testing assignment insert with assigned_by_id...');
    const result = await pool.query(
      "INSERT INTO paper_assignments (subject_id, exam_id, paper_setter_id, assigned_by_id, set_name, status) VALUES ($1, $2, $3, $4, 'A', 'Pending') RETURNING id",
      [subject_id, exam_id, setter_id, setter_id]
    );
    console.log('SUCCESS INSERT ASSIGNMENT', result.rows[0].id);

    console.log('Testing question_papers insert...');
    await pool.query(
      "INSERT INTO question_papers (assignment_id, title, setter_id, file_path, iv) VALUES ($1, $2, $3, $4, $5)",
      [result.rows[0].id, 'Sample Title', setter_id, 'file.enc', 'abcdefqwer']
    );
    console.log('SUCCESS INSERT QUESTION PAPER');
    
    // Cleanup
    await pool.query('DELETE FROM question_papers WHERE assignment_id=$1', [result.rows[0].id]);
    await pool.query('DELETE FROM paper_assignments WHERE id=$1', [result.rows[0].id]);
  } catch(e) {
    console.error('SQL ERROR:', e.message);
  } finally {
    process.exit();
  }
}

test();

