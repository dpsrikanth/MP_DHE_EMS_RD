const db = require('../config/db');

/**
 * Applies grace marks to a student for a specific exam series using strict budgeting rules.
 * @param {string} student_id 
 * @param {string} exam_name - Name of the exam series (e.g. 'B.Tech Sem 1')
 * @param {number} university_id 
 * @param {number} user_id 
 */
async function applyGraceMarks(student_id, exam_name, university_id, user_id = null) {
    try {
        // 1. Fetch Grading Policy
        const configRes = await db.query('SELECT * FROM grading_configs WHERE university_id = $1', [university_id]);
        if (configRes.rows.length === 0) return 0;
        
        const config = configRes.rows[0];
        const policy = typeof config.grace_policy === 'string' ? JSON.parse(config.grace_policy) : config.grace_policy;
        const passThreshold = config.pass_threshold || 40;


        if (!policy || !policy.is_enabled) {
            console.log(`[GRACE] Policy disabled for university ${university_id}. Skipping.`);
            return 0;
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
                COALESCE(m.internal_marks, (COALESCE(i.total_internal, 0) + COALESCE(o.total_other, 0)), 0) as calculated_internal,
                COALESCE(e.moderation_marks, 0) as moderation_marks,
                (
                    COALESCE(m.internal_marks, (COALESCE(i.total_internal, 0) + COALESCE(o.total_other, 0)), 0) + 
                    COALESCE(m.external_marks, 0) +
                    COALESCE(e.moderation_marks, 0)
                ) as projected_total_marks
            FROM marks m
            JOIN master_subjects sub ON m.subject_id = sub.id
            JOIN exams e ON m.exam_id = e.id
            LEFT JOIN ia_summary i ON m.student_id = i.student_id AND m.subject_id = i.subject_id
            LEFT JOIN other_summary o ON m.student_id = o.student_id AND m.subject_id = o.subject_id
            WHERE m.student_id = $1 AND TRIM(e.name) ILIKE TRIM($2)
        `, [student_id, exam_name]);

        const marks = marksRes.rows;
        if (marks.length === 0) return 0;

        // 3. Calculate Aggregate Marks & 1% Budget
        // Align budget calculation with preview logic: Use the higher of series count or student's subject count
        const seriesInfo = await db.query(
            "SELECT COUNT(DISTINCT subject_id) as count FROM exams WHERE TRIM(name) ILIKE TRIM($1)",
            [exam_name]
        );
        const seriesCount = parseInt(seriesInfo.rows[0].count) || 0;
        const totalSubjectsCount = Math.max(seriesCount, marks.length);
        
        const graceBudget = totalSubjectsCount; // 1% of (count * 100)
        const maxPerSubjectGrace = Math.max(graceBudget, Number(policy.max_per_subject_grace) || 0);

        // 4. Identify Fails
        const failingSubjects = marks.filter(m => {
            const total = Number(m.projected_total_marks);
            return total < passThreshold && total > 0;
        });

        // If no failures, no grace needed
        if (failingSubjects.length === 0) return 0;

        // CRITICAL RULE 1: Disqualify if failing > 2 subjects
        if (failingSubjects.length > 2) {
            console.log(`[GRACE] Disqualified: Student ${student_id} failed > 2 subjects (${failingSubjects.length} fails).`);
            return 0;
        }

        // CRITICAL RULE 2: Internals check
        for (const m of failingSubjects) {
            const internal = Number(m.calculated_internal) || 0;
            if (internal === 0) {
                console.log(`[GRACE] Disqualified: Student ${student_id} failed internals (0 marks) in ${m.subject_name}.`);
                return 0;
            }
        }

        // 5. Calculate total grace needed and check caps
        let totalGraceNeeded = 0;
        for (const m of failingSubjects) {
            const gap = passThreshold - Number(m.projected_total_marks);
            
            // CRITICAL RULE 3: Single subject cap
            if (gap > maxPerSubjectGrace) {
                console.log(`[GRACE] Disqualified: Gap (${gap}) exceeds cap (${maxPerSubjectGrace}) for ${m.subject_name}. Student ID: ${student_id}`);
                return 0;
            }
            totalGraceNeeded += gap;
        }

        // CRITICAL RULE 4: Budget Check (All-or-Nothing)
        if (totalGraceNeeded > graceBudget) {
            console.log(`[GRACE] Disqualified: Total grace needed (${totalGraceNeeded}) exceeds 1% budget (${graceBudget}).`);
            return 0;
        }

        // 6. Apply Grace Marks (Transaction)
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            for (const m of failingSubjects) {
                const gap = passThreshold - Number(m.projected_total_marks);
                const oldTotal = m.total_marks;
                const finalTotal = Number(m.projected_total_marks) + gap;

                await client.query(`
                    UPDATE marks 
                    SET grace_marks = $1::numeric, 
                        total_marks = $3::numeric,
                        status = 'Pass',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [gap, m.id, finalTotal]);
                
                if (user_id) {
                    await client.query(`
                        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        user_id, 
                        'APPLY_GRACE', 
                        'marks', 
                        m.id, 
                        JSON.stringify({ total_marks: oldTotal, status: m.status }), 
                        JSON.stringify({ total_marks: finalTotal, status: 'Pass', grace_marks: gap, exam_series: exam_name })
                    ]);
                }
            }
            
            await client.query('COMMIT');
            console.log(`[GRACE] Success: Applied ${totalGraceNeeded} total grace marks to student ${student_id} across ${failingSubjects.length} subject(s). Budget was ${graceBudget}.`);
            return totalGraceNeeded;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error(`[GRACE ERROR] Failed for student ${student_id}:`, error);
        return 0;
    }
}

module.exports = { applyGraceMarks };
