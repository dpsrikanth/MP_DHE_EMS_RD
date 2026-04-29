const db = require('../db');

/**
 * Applies grace marks to a student for a specific exam series.
 * @param {string} student_id 
 * @param {string} exam_name - Name of the exam series (e.g. 'B.Tech Sem 1')
 * @param {number} university_id 
 */
async function applyGraceMarks(student_id, exam_name, university_id, user_id = null) {
    try {
        // 1. Fetch Grading Policy
        const configRes = await db.query('SELECT * FROM grading_configs WHERE university_id = $1', [university_id]);
        if (configRes.rows.length === 0) return;
        
        const config = configRes.rows[0];
        const policy = typeof config.grace_policy === 'string' ? JSON.parse(config.grace_policy) : config.grace_policy;
        const passThreshold = config.pass_threshold || 40;

        const maxTotalGrace = policy.max_total_grace || 0;
        const maxPerSubjectGrace = policy.max_per_subject_grace || 0;

        if (!policy || !policy.is_enabled || maxPerSubjectGrace === 0) {
            console.log(`[GRACE] Policy disabled or limit is 0 for university ${university_id}. Skipping.`);
            return;
        }

        // 2. Fetch all marks for this student in this exam series
        const marksRes = await db.query(`
            WITH ia_summary AS (
                SELECT 
                    student_id, 
                    subject_id, 
                    SUM(marks) as total_internal
                FROM (
                    SELECT 
                        sim.student_id, sim.subject_id, sim.marks_obtained::float as marks,
                        ROW_NUMBER() OVER (PARTITION BY sim.student_id, sim.subject_id ORDER BY sim.marks_obtained::float DESC) as rnk
                    FROM student_internal_marks sim
                    JOIN internal_marks_structure ims ON sim.component_id = ims.id
                    WHERE ims.component_name ILIKE 'IA%'
                ) t WHERE rnk <= 2
                GROUP BY student_id, subject_id
            ),
            other_summary AS (
                SELECT 
                    sim.student_id, sim.subject_id, SUM(sim.marks_obtained::float) as total_other
                FROM student_internal_marks sim
                JOIN internal_marks_structure ims ON sim.component_id = ims.id
                WHERE ims.component_name NOT ILIKE 'IA%' 
                  AND ims.component_name NOT ILIKE 'TOTAL%'
                GROUP BY sim.student_id, sim.subject_id
            )
            SELECT 
                m.*, 
                sub.name as subject_name,
                (
                    COALESCE(m.internal_marks, (COALESCE(i.total_internal, 0) + COALESCE(o.total_other, 0)), 0) + 
                    COALESCE(m.external_marks, 0)
                ) as projected_total_marks
            FROM marks m
            JOIN master_subjects sub ON m.subject_id = sub.id
            JOIN exams e ON m.exam_id = e.id
            LEFT JOIN ia_summary i ON m.student_id = i.student_id AND m.subject_id = i.subject_id
            LEFT JOIN other_summary o ON m.student_id = o.student_id AND m.subject_id = o.subject_id
            WHERE m.student_id = $1 AND e.name = $2
        `, [student_id, exam_name]);

        const marks = marksRes.rows;
        let totalGraceUsed = 0;

        // Filter subjects that are failing (but have some marks entered)
        const failingSubjects = marks.filter(m => {
            const total = Number(m.projected_total_marks);
            return total < passThreshold && total > 0;
        });
        
        // Sort by how close they are to passing (ascending gap)
        failingSubjects.sort((a, b) => (passThreshold - Number(a.projected_total_marks)) - (passThreshold - Number(b.projected_total_marks)));

        for (const m of failingSubjects) {
            const gap = passThreshold - Number(m.projected_total_marks);
            
            // Check if this subject can be saved within per-subject limit and remaining total budget
            if (gap <= maxPerSubjectGrace && (totalGraceUsed + gap) <= maxTotalGrace) {
                const oldTotal = m.total_marks;
                const newTotal = Number(m.total_marks) + gap;

                // Apply grace
                const finalTotal = Number(m.projected_total_marks) + gap;
                await db.query(`
                    UPDATE marks 
                    SET grace_marks = $1::numeric, 
                        total_marks = $3::numeric,
                        status = 'Pass',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [gap, m.id, finalTotal]);
                
                // 3. Audit Log
                if (user_id) {
                    await db.query(`
                        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        user_id, 
                        'APPLY_GRACE', 
                        'marks', 
                        m.id, 
                        JSON.stringify({ total_marks: oldTotal, status: m.status }), 
                        JSON.stringify({ total_marks: newTotal, status: 'Pass', grace_marks: gap, exam_series: exam_name })
                    ]);
                }

                totalGraceUsed += gap;
                console.log(`[GRACE] Applied ${gap} marks to student ${student_id} for subject ${m.subject_name}`);
            }
        }

        return totalGraceUsed;
    } catch (error) {
        console.error(`[GRACE ERROR] Failed for student ${student_id}:`, error);
    }
}

module.exports = { applyGraceMarks };
