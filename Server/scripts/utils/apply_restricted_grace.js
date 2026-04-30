const db = require('./db');
const { applyGraceMarks } = require('./utils/graceUtils');

async function run() {
  try {
    const universityId = 7;
    const examSeriesName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';

    // 1. Update Policy to Max 5 marks
    console.log("Setting Grace Policy to Max 5 marks...");
    await db.query(`
      UPDATE grading_configs 
      SET grace_policy = '{"is_enabled": true, "max_total_grace": 15, "max_per_subject_grace": 5}'
      WHERE university_id = $1
    `, [universityId]);

    // 2. Reset existing grace marks for this series to get a clean state
    console.log("Resetting existing grace marks...");
    await db.query(`
      UPDATE marks 
      SET grace_marks = 0, status = 'Pending Approval'
      WHERE exam_id IN (SELECT id FROM exams WHERE name = $1)
    `, [examSeriesName]);

    // 3. Re-apply grace with the new 5-mark limit
    const rollNumbers = ['25BT1301', '25BT1302', '25BT1303', '25BT1304'];
    for (const roll of rollNumbers) {
      const studentRes = await db.query("SELECT id FROM students WHERE rollnumber = $1", [roll]);
      if (studentRes.rows.length > 0) {
        const studentId = studentRes.rows[0].id;
        console.log(`Re-calculating Grace for: ${roll}...`);
        await applyGraceMarks(studentId, examSeriesName, universityId, null);
      }
    }

    console.log("Grace policy applied successfully.");
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();
