const pool = require('./db');

async function debugAnil() {
  try {
    const userRes = await pool.query("SELECT id, name, email FROM users WHERE name ILIKE '%Anil Kumar%'");
    console.log('--- Anil Kumar Users ---');
    console.table(userRes.rows);

    if (userRes.rows.length > 0) {
      const anilId = userRes.rows[0].id;
      const assRes = await pool.query(`
        SELECT pa.id, pa.status, pa.assigned_chief_id, qp.id as paper_id
        FROM paper_assignments pa
        LEFT JOIN question_papers qp ON qp.assignment_id = pa.id
        WHERE pa.assigned_chief_id = $1 OR pa.assigned_by_hod_id = $1
      `, [anilId]);
      console.log(`--- Assignments for Anil (ID: ${anilId}) ---`);
      console.table(assRes.rows);
    }

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

debugAnil();
