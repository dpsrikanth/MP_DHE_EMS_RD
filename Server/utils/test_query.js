
const db = require('../db');

async function test() {
    try {
        const req = {
            query: {
                exam_name: 'BTech Sem-1 MP UNIVERSITY Ext'
            },
            user: {
                university_id: 1 
            }
        };

        const { exam_id, exam_name, college_id, program_id } = req.query;
        const university_id = req.user?.university_id || req.user?.universityId;

        const conditions = [];
        const params = [];
        let paramIdx = 1;

        conditions.push(`(e.exam_type = 1 OR er.payment_status = 'Paid')`);

        if (university_id) {
            conditions.push(`(e.university_id = $${paramIdx++} OR c.university_id = $${paramIdx - 1})`);
            params.push(university_id);
        }

        if (exam_id) {
            conditions.push(`e.id = $${paramIdx++}`);
            params.push(exam_id);
        }
        if (exam_name) {
            conditions.push(`TRIM(e.name) ILIKE TRIM($${paramIdx++})`);
            params.push(exam_name);
        }
        if (college_id) {
            conditions.push(`c.id = $${paramIdx++}`);
            params.push(college_id);
        }
        if (program_id) {
            conditions.push(`e.program_id = $${paramIdx++}`);
            params.push(program_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            WITH ia_ranked AS (
                SELECT 
                    sim_ia.student_id, 
                    sim_ia.subject_id, 
                    sim_ia.marks_obtained::float as marks,
                    ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                FROM student_internal_marks sim_ia
                JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                WHERE ims_ia.component_name ILIKE 'IA%'
            ),
            ia_summary AS (
                SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
                FROM ia_ranked ir
                WHERE ir.rnk <= 2
                GROUP BY ir.student_id, ir.subject_id
            ),
            other_summary AS (
                SELECT 
                    sim_o.student_id, 
                    sim_o.subject_id, 
                    SUM(sim_o.marks_obtained::float) as other_total
                FROM student_internal_marks sim_o
                JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                WHERE ims_o.component_name NOT ILIKE 'IA%' 
                  AND ims_o.component_name NOT ILIKE 'TOTAL%'
                  AND ims_o.component_name NOT ILIKE 'BEST_OF_3%'
                GROUP BY sim_o.student_id, sim_o.subject_id
            ),
            raw_internal AS (
                SELECT 
                    COALESCE(i.student_id, o.student_id) as student_id,
                    COALESCE(i.subject_id, o.subject_id) as subject_id,
                    (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
                FROM ia_summary i
                FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
            ),
            marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    s.id as student_id,
                    e.id as exam_id,
                    COALESCE(m.status, 'Not Entered') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    (COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    e.exam_type,
                    e.results_published,
                    sub.name as subject_name, sub.id as subject_id,
                    sub.credit as credits
                FROM exams e
                JOIN master_programs mp ON e.program_id = mp.id
                JOIN master_semesters ms ON e.semester_id = ms.id
                JOIN students s ON s."programName" = mp.name 
                    AND (
                        (e.exam_type = 1 AND s.semister = ms.semester_name)
                        OR (e.exam_type = 2) 
                    )
                JOIN master_subjects sub ON e.subject_id = sub.id
                LEFT JOIN exam_registrations er ON er.student_id = s.id AND er.exam_id = e.id
                JOIN colleges c ON s."collageName" ILIKE c.name
                LEFT JOIN marks_workflow_status mws ON mws.college_id = c.id 
                    AND mws.subject_id = sub.id 
                    AND (mws.section = s.section OR s.section IS NULL OR s.section = '')
                LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e.id AND m.subject_id = e.subject_id
                LEFT JOIN calculated_internal_marks cim ON cim.student_id = s.id 
                    AND cim.subject_id = e.subject_id
                    AND cim.college_id = c.id
                LEFT JOIN raw_internal ri ON ri.student_id = s.id AND ri.subject_id = sub.id
                ${whereClause}
                AND (
                    e.exam_type = 2
                    OR mws.status IN ('Locked', 'Approved', 'Finalized', 'Submitted')
                )
            )
            SELECT * FROM marks_base
            ORDER BY subject_name ASC, rollnumber ASC
        `;

        console.log("Testing query with params:", params);
        const result = await db.query(query, params);
        console.log("Query success! Rows count:", result.rowCount);
        process.exit(0);
    } catch (error) {
        console.error("Query failed!");
        console.error(error);
        process.exit(1);
    }
}

test();
