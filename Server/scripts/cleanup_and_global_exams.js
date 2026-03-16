const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function run() {
    try {
        console.log("--- Starting Cleanup and Global Exam Creation ---");
        
        // 1. Delete previous duplicates
        const deleteRes = await pool.query(`
            DELETE FROM exams 
            WHERE name IN ('B.Tech Sem-1 External Exam 2024-25', 'External Examination 2026')
        `);
        console.log(`Deleted ${deleteRes.rowCount} duplicate exam records.`);

        // 2. Constants for Global Exams
        const EXAM_NAME = "B.Tech Sem-1 University External Exam 2024-25";
        const EXAM_DATE = "2025-05-20";
        const PROGRAM_ID = 2; // B.Tech
        const SEMESTER_ID = 15; // Semester 1
        const ACADEMIC_YEAR_ID = 1; // 2014-25 (ID 1)
        const EXAM_TYPE_ID = 2; // External

        // 3. Identify Subjects and Departments for B.Tech Sem 1
        const subjectDeptQuery = `
            WITH BTechSubjects AS (
                SELECT id as subject_id FROM master_subjects 
                WHERE program_id = $1 AND semester_id = $2 AND (status = 'Active' OR status IS NULL)
                UNION
                SELECT subject_id FROM master_subject_mappings
                WHERE program_id = $1 AND semester_id = $2 AND status = 'Active'
            )
            SELECT DISTINCT bs.subject_id, msd.department_id
            FROM BTechSubjects bs
            JOIN master_subject_departments msd ON bs.subject_id = msd.subject_id
        `;
        
        const subjectDepts = await pool.query(subjectDeptQuery, [PROGRAM_ID, SEMESTER_ID]);
        console.log(`Found ${subjectDepts.rows.length} subject-department combinations for global exams.`);

        let createdCount = 0;

        for (const sd of subjectDepts.rows) {
            const { subject_id, department_id } = sd;

            await pool.query(
                `INSERT INTO exams (
                    name, semester_id, college_id, exam_type, exam_date, 
                    status, department_id, program_id, academic_year_id, subject_id,
                    is_published, student_application_open
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    EXAM_NAME, SEMESTER_ID, null, EXAM_TYPE_ID, EXAM_DATE, 
                    true, department_id, PROGRAM_ID, ACADEMIC_YEAR_ID, subject_id,
                    true, true // University-wide exams can be active immediately
                ]
            );
            createdCount++;
        }

        console.log(`Successfully created ${createdCount} university-wide external exam records.`);

    } catch (err) {
        console.error("Cleanup/Migration error:", err);
    } finally {
        pool.end();
    }
}

run();
