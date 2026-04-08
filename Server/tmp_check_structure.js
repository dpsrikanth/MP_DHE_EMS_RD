const db = require('./db');

async function check() {
    try {
        const query = `
            SELECT 
                s.id as subject_id, 
                s.name as subject_name,
                ms.semester_name,
                ims.id as structure_id
            FROM master_subjects s
            JOIN master_semesters ms ON s.semester_id = ms.id
            LEFT JOIN internal_marks_structure ims ON s.id = ims.subject_id
            WHERE ms.semester_name = 'Semester 1'
            AND s."programName" = 'BTech'
        `;
        const res = await db.query(query);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
