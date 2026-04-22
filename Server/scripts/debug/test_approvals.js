const db = require('../../db');
async function test() {
    const query = `
        SELECT 
            fs.subject_id, fs.semester_id, fs.academic_year_id, fs.section,
            ms.name as subject_name, ms.subject_code,
            mse.semester_name,
            may.year_name,
            ims.id as component_id, ims.component_name, ims.max_marks,
            COUNT(DISTINCT sim.student_id) as student_count,
            COALESCE(ca.is_accepted, FALSE) as is_accepted,
            ca.accepted_at
        FROM faculty_subjects fs
        JOIN master_subjects ms ON fs.subject_id = ms.id
        JOIN master_semesters mse ON fs.semester_id = mse.id
        JOIN master_academic_years may ON fs.academic_year_id = may.id
        JOIN internal_marks_structure ims ON ims.subject_id = fs.subject_id AND ims.college_id = fs.college_id
        JOIN student_internal_marks sim ON sim.component_id = ims.id
        LEFT JOIN component_acceptance ca ON ca.college_id = fs.college_id 
            AND ca.subject_id = fs.subject_id 
            AND ca.semester_id = fs.semester_id
            AND ca.academic_year_id = fs.academic_year_id
            AND ca.section = fs.section
            AND ca.component_id = ims.id
        WHERE fs.college_id = $1
        GROUP BY 
            fs.subject_id, fs.semester_id, fs.academic_year_id, fs.section,
            ms.name, ms.subject_code, mse.semester_name, may.year_name,
            ims.id, ims.component_name, ims.max_marks, ca.is_accepted, ca.accepted_at
        HAVING COUNT(DISTINCT sim.student_id) > 0
        ORDER BY fs.subject_id, fs.section, ims.id
    `;
    try {
        const res = await db.query(query, [10]);
        console.log("Returned rows:", res.rows.length);
        if (res.rows.length > 0) {
            console.log(res.rows[0]);
        }
    } catch(e) { console.error(e); }
    process.exit(0);
}
test();
