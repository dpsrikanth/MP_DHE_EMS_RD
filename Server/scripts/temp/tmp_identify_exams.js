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
        console.log("--- Checking Subjects with Mappings and Marks Structure ---");
        
        // Find all subjects that are mapped to a program and semester
        // We look both in master_subjects (direct link) and master_subject_mappings
        const subjectsQuery = `
            SELECT 
                ms.id as subject_id, 
                ms.name as subject_name,
                ms.program_id,
                ms.semester_id,
                msd.department_id,
                mp.name as program_name,
                msm.semester_name
            FROM master_subjects ms
            JOIN master_subject_departments msd ON ms.id = msd.subject_id
            LEFT JOIN master_programs mp ON ms.program_id = mp.id
            LEFT JOIN master_semesters msm ON ms.semester_id = msm.id
            WHERE ms.program_id IS NOT NULL 
              AND ms.semester_id IS NOT NULL
              AND ms.status = 'Active' OR ms.status IS NULL
            
            UNION
            
            SELECT 
                msm.subject_id,
                ms.name as subject_name,
                msm.program_id,
                msm.semester_id,
                msd.department_id,
                mp.name as program_name,
                mse.semester_name
            FROM master_subject_mappings msm
            JOIN master_subjects ms ON msm.subject_id = ms.id
            JOIN master_subject_departments msd ON ms.id = msd.subject_id
            LEFT JOIN master_programs mp ON msm.program_id = mp.id
            LEFT JOIN master_semesters mse ON msm.semester_id = mse.id
            WHERE msm.status = 'Active'
        `;
        
        const subjectsResult = await pool.query(subjectsQuery);
        console.log(`Found ${subjectsResult.rows.length} mapped subject-department-program combinations.`);

        // For each, check if marks structure exists for college_id = 10 (admin user's college)
        const COLLEGE_ID = 10;
        
        const existingExams = await pool.query("SELECT subject_id, program_id, semester_id, department_id FROM exams WHERE college_id = $1 AND exam_type = 2", [COLLEGE_ID]);
        const set = new Set(existingExams.rows.map(r => `${r.subject_id}-${r.program_id}-${r.semester_id}-${r.department_id}`));

        console.log(`Found ${existingExams.rows.length} existing external exams for college 10.`);

        let toCreate = [];
        for (const row of subjectsResult.rows) {
            const key = `${row.subject_id}-${row.program_id}-${row.semester_id}-${row.department_id}`;
            if (!set.has(key)) {
                // Check marks structure
                const structure = await pool.query(
                    "SELECT 1 FROM internal_marks_structure WHERE college_id = $1 AND department_id = $2 AND program_id = $3 AND subject_id = $4 LIMIT 1",
                    [COLLEGE_ID, row.department_id, row.program_id, row.subject_id]
                );
                
                if (structure.rows.length > 0) {
                    toCreate.push(row);
                }
            }
        }

        console.log(`Need to create ${toCreate.length} external exams (matching marks structure).`);
        console.table(toCreate.slice(0, 10));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
