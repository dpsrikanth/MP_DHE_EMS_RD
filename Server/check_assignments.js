require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function run() {
  const r = await db.query(`
    SELECT efa.id, efa.exam_id, efa.subject_id, e.name
    FROM external_faculty_assignments efa
    JOIN exams e ON e.id = efa.exam_id
  `);
  console.table(r.rows);
  process.exit();
}
run().catch(e => { console.error(e); process.exit(1); });
