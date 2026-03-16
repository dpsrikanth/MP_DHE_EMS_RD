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
        console.log("--- Starting University-wide B.Tech Sem 1 External Exam Creation ---");
        
        const EXAM_NAME = "B.Tech Sem-1 External Exam 2024-25";
        const EXAM_DATE = "2025-05-20";
        const PROGRAM_ID = 2; // B.Tech
        const SEMESTER_ID = 15; // Semester 1
        const ACADEMIC_YEAR_ID = 1; // 2024-2025
        const EXAM_TYPE_ID = 2; // External

        // 1. Get all colleges
        const colleges = await pool.query("SELECT id FROM colleges WHERE status = true OR status IS NULL");
        console.log(`Processing for ${colleges.rows.length} colleges.`);

        // 2. Identify all subjects for B.Tech Sem 1 with their departments
        // Use a CTE or subquery to get unique subject-department pairs for B.Tech Sem 1
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
        console.log(`Found ${subjectDepts.rows.length} subject-department combinations for B.Tech Sem 1.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const col of colleges.rows) {
            const COLLEGE_ID = col.id;
            
            for (const sd of subjectDepts.rows) {
                const { subject_id, department_id } = sd;

                // Check if exists
                const check = await pool.query(
                    `SELECT id FROM exams 
                     WHERE college_id = $1 AND subject_id = $2 AND program_id = $3 
                       AND semester_id = $4 AND department_id = $5 AND exam_type = $6`,
                    [COLLEGE_ID, subject_id, PROGRAM_ID, SEMESTER_ID, department_id, EXAM_TYPE_ID]
                );

                if (check.rows.length === 0) {
                    await pool.query(
                        `INSERT INTO exams (
                            name, semester_id, college_id, exam_type, exam_date, 
                            status, department_id, program_id, academic_year_id, subject_id,
                            is_published, student_application_open
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                        [
                            EXAM_NAME, SEMESTER_ID, COLLEGE_ID, EXAM_TYPE_ID, EXAM_DATE, 
                            true, department_id, PROGRAM_ID, ACADEMIC_YEAR_ID, subject_id,
                            false, false
                        ]
                    );
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`--- University-wide Bulk Creation Finished ---`);
        console.log(`Colleges Processed: ${colleges.rows.length}`);
        console.log(`Total Exams Created: ${createdCount}`);
        console.log(`Skipped (already exists): ${skippedCount}`);

    } catch (err) {
        console.error("University bulk creation error:", err);
    } finally {
        pool.end();
    }
}

run();
