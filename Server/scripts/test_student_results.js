const pool = require('../db.js');
async function run() {
    try {
        const query = `
      SELECT 
        e.exam_type,
        e.name as exam_name,
        e.results_published
      FROM students s
      JOIN master_programs p ON s."programName" = p.name
      LEFT JOIN colleges c ON c.name = s."collageName"
      JOIN exams e ON e.program_id = p.id 
          AND (e.college_id = c.id OR (e.college_id IS NULL AND e.exam_type = 2))
      WHERE (e.exam_type = 1) OR (e.exam_type = 2 AND e.results_published = true)
      LIMIT 5
        `;
        const res = await pool.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

