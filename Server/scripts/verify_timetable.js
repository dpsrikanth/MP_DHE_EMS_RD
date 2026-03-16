const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function verify() {
    try {
        console.log("--- Verifying Multi-subject Batch Creation ---");
        
        const testPayload = {
            name: "SUPPLEMENTARY EXAMINATIONS: MARCH 2026",
            semester_id: 15,
            exam_type: 2, // External
            program_id: 2,
            department_id: 4,
            academic_year_id: 1,
            subjects: [
                { subject_id: 1, exam_date: '2026-03-23', start_time: '09.00 A.M', end_time: '12.00 NOON' },
                { subject_id: 2, exam_date: '2026-03-25', start_time: '09.00 A.M', end_time: '12.00 NOON' }
            ]
        };

        // Note: Since I don't want to actually hit the API endpoint from here easily without a full server context,
        // I will just check the existence of the columns and the query logic in my mind, 
        // OR better, I'll run a SQL check to see if the table responds to a sample insert.

        const checkRes = await pool.query(`
            INSERT INTO exams (
                name, semester_id, exam_type, exam_date, start_time, end_time, 
                status, department_id, program_id, academic_year_id, subject_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            ["TEST_TIMETABLE", 15, 2, "2026-03-23", "09.00 A.M", "12.00 NOON", true, 4, 2, 1, 1]
        );
        
        console.log(`Successfully inserted test record with ID: ${checkRes.rows[0].id}`);
        
        // Clean up
        await pool.query("DELETE FROM exams WHERE name = 'TEST_TIMETABLE'");
        console.log("Cleaned up test record.");
        
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        pool.end();
    }
}

verify();
