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
        console.log("--- Starting Bulk External Exam Creation ---");
        
        const EXAM_NAME = "External Examination 2026";
        const EXAM_DATE = "2026-05-20";
        const ACADEMIC_YEAR_ID = 1;
        const COLLEGE_ID = 10;
        const EXAM_TYPE_ID = 2; // External

        // Find all subjects that are mapped to a program and semester
        const subjectsQuery = `
            SELECT DISTINCT
                ms.id as subject_id, 
                ms.program_id,
                ms.semester_id,
                msd.department_id
            FROM master_subjects ms
            JOIN master_subject_departments msd ON ms.id = msd.subject_id
            WHERE ms.program_id IS NOT NULL 
              AND ms.semester_id IS NOT NULL
              AND (ms.status = 'Active' OR ms.status IS NULL)
            
            UNION
            
            SELECT DISTINCT
                msm.subject_id,
                msm.program_id,
                msm.semester_id,
                msd.department_id
            FROM master_subject_mappings msm
            JOIN master_subjects ms ON msm.subject_id = ms.id
            JOIN master_subject_departments msd ON ms.id = msd.subject_id
            WHERE msm.status = 'Active'
        `;
        
        const subjectsResult = await pool.query(subjectsQuery);
        console.log(`Found ${subjectsResult.rows.length} subject-department-program combinations to process.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const row of subjectsResult.rows) {
            const { subject_id, program_id, semester_id, department_id } = row;

            // Check if exists
            const check = await pool.query(
                `SELECT id FROM exams 
                 WHERE college_id = $1 AND subject_id = $2 AND program_id = $3 
                   AND semester_id = $4 AND department_id = $5 AND exam_type = $6`,
                [COLLEGE_ID, subject_id, program_id, semester_id, department_id, EXAM_TYPE_ID]
            );

            if (check.rows.length === 0) {
                // Insert
                await pool.query(
                    `INSERT INTO exams (
                        name, semester_id, college_id, exam_type, exam_date, 
                        status, department_id, program_id, academic_year_id, subject_id,
                        is_published, student_application_open
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        EXAM_NAME, semester_id, COLLEGE_ID, EXAM_TYPE_ID, EXAM_DATE, 
                        true, department_id, program_id, ACADEMIC_YEAR_ID, subject_id,
                        false, false
                    ]
                );
                createdCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`--- Bulk Creation Finished ---`);
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped (already exists): ${skippedCount}`);

    } catch (err) {
        console.error("Bulk creation error:", err);
    } finally {
        pool.end();
    }
}

run();
