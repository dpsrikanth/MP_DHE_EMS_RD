const pool = require('../db.js');

const subjects = [
    { name: 'Applied Physics', code: 'BTH202', credit: 4 },
    { name: 'Data Structures & Algorithms', code: 'BTH203', credit: 4 },
    { name: 'Basic Electrical Engineering', code: 'BTH204', credit: 3 },
    { name: 'Engineering Graphics', code: 'BTH205', credit: 3 },
    { name: 'Communicative English', code: 'BTH206', credit: 2 }
];

async function insertSubjects() {
    try {
        console.log("Checking for existing subjects for Sem 2 (ID 16)...");
        
        for (const sub of subjects) {
            // Check if already exists to avoid duplicates
            const check = await pool.query(
                "SELECT id FROM master_subjects WHERE program_id = 2 AND semester_id = 16 AND name = $1",
                [sub.name]
            );

            if (check.rows.length === 0) {
                console.log(`Inserting ${sub.name}...`);
                await pool.query(
                    `INSERT INTO master_subjects 
                    (name, subject_code, credit, program_id, semester_id, university_id, status, has_examination, mapping_type, is_mandatory, periods_per_week) 
                    VALUES ($1, $2, $3, 2, 16, 7, 'Active', true, 'Major', 'M', 6)`,
                    [sub.name, sub.code, sub.credit]
                );
            } else {
                console.log(`Subject ${sub.name} already exists. Skipping.`);
            }
        }

        console.log("Subject mapping complete.");
    } catch (err) {
        console.error("Error inserting subjects:", err);
    } finally {
        pool.end();
    }
}

insertSubjects();

