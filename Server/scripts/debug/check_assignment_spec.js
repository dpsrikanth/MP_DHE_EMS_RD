const pool = require('../../db');
async function checkAssignment() {
  try {
    const q = `
      SELECT pa.id, ms.name as subject_name, pa.assigned_chief_id, pa.status, qp.id as paper_id
      FROM paper_assignments pa 
      JOIN master_subjects ms ON pa.subject_id = ms.id 
      LEFT JOIN question_papers qp ON qp.assignment_id = pa.id
      WHERE ms.name ILIKE '%Computer Network%'
    `;
    const res = await pool.query(q);
    console.log('--- Computer Network Assignment Doc ---');
    console.table(res.rows);

    const users = await pool.query('SELECT id, name, email FROM users WHERE id IN (SELECT DISTINCT assigned_chief_id FROM paper_assignments)');
    console.log('--- Current Chief Examiners in DB ---');
    console.table(users.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}
checkAssignment();
