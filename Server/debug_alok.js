const db = require('./db');
async function debug() {
    const exam_name = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
    const query = `
        WITH target_subjects AS (
            SELECT DISTINCT subject_id FROM exams WHERE TRIM(name) ILIKE TRIM($1::text)
        ),
        ia_ranked AS (
            SELECT sim_ia.student_id, sim_ia.subject_id, sim_ia.marks_obtained::float as marks,
            ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
            FROM student_internal_marks sim_ia
            JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
            JOIN target_subjects ts ON sim_ia.subject_id = ts.subject_id
            WHERE ims_ia.component_name ILIKE 'IA%'
        ),
        ia_summary AS (
            SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
            FROM ia_ranked ir WHERE ir.rnk <= 2 GROUP BY ir.student_id, ir.subject_id
        ),
        other_summary AS (
            SELECT sim_o.student_id, sim_o.subject_id, SUM(sim_o.marks_obtained::float) as other_total
            FROM student_internal_marks sim_o
            JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
            JOIN target_subjects ts ON sim_o.subject_id = ts.subject_id
            WHERE ims_o.component_name NOT ILIKE 'IA%' AND ims_o.component_name NOT ILIKE 'TOTAL%'
            GROUP BY sim_o.student_id, sim_o.subject_id
        ),
        raw_internal AS (
            SELECT COALESCE(i.student_id, o.student_id) as student_id, COALESCE(i.subject_id, o.subject_id) as subject_id,
            (COALESCE(i.ia_total, 0) + COALESCE(o.total_other, 0)) as total_raw
            FROM ia_summary i 
            FULL OUTER JOIN (SELECT student_id, subject_id, other_total as total_other FROM other_summary) o 
                ON i.student_id = o.student_id AND i.subject_id = o.subject_id
        ),
        marks_base AS (
            SELECT 
                m.id as mark_id, s.id as student_id, e.id as exam_id,
                COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) as internal_marks, 
                COALESCE(m.external_marks, 0) as external_marks,
                COALESCE(gc.pass_threshold, 40) as pass_threshold,
                (gc.grace_policy->>'is_enabled')::boolean as is_grace_enabled,
                (gc.grace_policy->>'max_per_subject_grace')::numeric as max_grace,
                (COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0)) as raw_total,
                COALESCE(m.grace_marks, 0) as grace_marks,
                s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                e.name as exam_name, sub.name as subject_name, sub.id as subject_id, e.results_published
            FROM exams e
            JOIN master_programs mp ON e.program_id = mp.id
            JOIN master_semesters ms ON e.semester_id = ms.id
            JOIN students s ON TRIM(s."programName") ILIKE TRIM(mp.name)
                AND ((e.exam_type = 1 AND TRIM(s.semister) ILIKE TRIM(ms.semester_name)) OR (e.exam_type = 2))
            JOIN master_subjects sub ON e.subject_id = sub.id
            LEFT JOIN grading_configs gc ON gc.university_id = e.university_id
            LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e.id AND m.subject_id = e.subject_id
            LEFT JOIN calculated_internal_marks cim ON cim.student_id = s.id AND cim.subject_id = e.subject_id
            LEFT JOIN raw_internal ri ON ri.student_id = s.id AND ri.subject_id = sub.id
            WHERE TRIM(e.name) ILIKE TRIM($1::text)
        )
        SELECT * FROM marks_base
    `;
    const result = await db.query(query, [exam_name]);
    const rows = result.rows;
    const studentGroups = {};
    rows.forEach(r => { if (!studentGroups[r.student_id]) studentGroups[r.student_id] = []; studentGroups[r.student_id].push(r); });
    
    const alok = Object.values(studentGroups).find(g => g[0].student_name.includes('Alok'));
    if (alok) {
        console.log(`Alok Details:`);
        alok.forEach(m => console.log(` - ${m.subject_name}: Int=${m.internal_marks}, Ext=${m.external_marks}, Total=${m.raw_total}`));
        const fails = alok.filter(m => Number(m.raw_total) < 40 && Number(m.raw_total) > 0);
        console.log(`Fails count: ${fails.length}`);
    }
    process.exit(0);
}
debug();
