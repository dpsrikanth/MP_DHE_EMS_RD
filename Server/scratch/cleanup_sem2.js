require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function cleanupSem2() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete student internal marks for Sem2 subjects
    const r1 = await client.query(
      'DELETE FROM student_internal_marks WHERE component_id IN (SELECT id FROM internal_marks_structure WHERE semester_id = 16)'
    );
    console.log('Deleted student_internal_marks:', r1.rowCount);

    // 2. Delete component_acceptance for Sem2
    const r2 = await client.query('DELETE FROM component_acceptance WHERE semester_id = 16');
    console.log('Deleted component_acceptance:', r2.rowCount);

    // 3. Delete marks_workflow_status for Sem2
    const r3 = await client.query(
      'DELETE FROM marks_workflow_status WHERE subject_id IN (SELECT DISTINCT subject_id FROM internal_exam_schedules WHERE semester_id = 16) AND semester_id = 16'
    );
    console.log('Deleted marks_workflow_status:', r3.rowCount);

    // 4. Delete internal_exam_schedules for Sem2
    const r4 = await client.query('DELETE FROM internal_exam_schedules WHERE semester_id = 16');
    console.log('Deleted internal_exam_schedules:', r4.rowCount);

    await client.query('COMMIT');
    console.log('\nAll Semester 2 internal exam data deleted successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR - rolled back:', err.message);
  } finally {
    client.release();
    process.exit();
  }
}

cleanupSem2();
