const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function check() {
    try {
        console.log("--- Exam Types ---");
        const examTypes = await pool.query('SELECT * FROM exam_types');
        console.table(examTypes.rows);

        console.log("\n--- Sample Subjects ---");
        const subjects = await pool.query('SELECT id, name, program_id, semester_id, mapping_type FROM master_subjects LIMIT 5');
        console.table(subjects.rows);

        console.log("\n--- Subjects Count ---");
        const count = await pool.query('SELECT count(*) FROM master_subjects');
        console.log("Total subjects:", count.rows[0].count);

        console.log("\n--- Programs ---");
        const programs = await pool.query('SELECT id, name FROM master_programs');
        console.table(programs.rows);

        console.log("\n--- Users Table Schema ---");
        const userCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.table(userCols.rows);

        console.log("\n--- Admin User Details ---");
        const user = await pool.query("SELECT * FROM users WHERE email = 'admin@example.com'");
        console.table(user.rows);

        console.log("\n--- Existing Exams ---");
        const exams = await pool.query('SELECT id, name, exam_type, exam_date, college_id, academic_year_id FROM exams ORDER BY id DESC LIMIT 5');
        console.table(exams.rows);

        console.log("\n--- Academic Years ---");
        const years = await pool.query('SELECT id, year_name FROM master_academic_years');
        console.table(years.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
check();
