const db = require('../config/db');

/**
 * Applies grace marks to a student for a specific exam series using strict budgeting rules.
 * @param {string} student_id 
 * @param {string} exam_name - Name of the exam series (e.g. 'B.Tech Sem 1')
 * @param {number} university_id 
 * @param {number} user_id 
 * @param {object} externalClient - Optional DB client for transaction sharing
 */
async function applyGraceMarks(student_id, exam_name, university_id, user_id = null, externalClient = null) {
    const client = externalClient || db;
    try {
        // 1. Fetch Grading Policy (Global for University)
        const configRes = await client.query('SELECT * FROM grading_configs WHERE university_id = $1', [university_id]);
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
        const seriesInfo = await client.query(
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
        // 5. Clean Slate: Reset any existing grace marks first (Transaction)
        const internalClient = externalClient ? null : await db.connect();
        const activeClient = externalClient || internalClient;
        
        try {
            if (!externalClient) await activeClient.query('BEGIN');
            
            // ALWAYS reset grace marks to 0 for this student in this series first
            for (const m of marks) {
                await activeClient.query(`
                    UPDATE marks 
                    SET grace_marks = 0, 
                        total_marks = $2::numeric,
                        status = CASE WHEN $2::numeric >= $3 THEN 'Pass' ELSE 'Fail' END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [m.id, m.projected_total_marks, passThreshold]);
            }

            // 6. Eligibility Validation (After Reset)
            const failingSubjects = marks.filter(m => Number(m.projected_total_marks) < passThreshold && Number(m.projected_total_marks) > 0);
            
            if (failingSubjects.length === 0) {
                if (!externalClient) await activeClient.query('COMMIT');
                return 0;
            }

            // Rule 1: Failing subjects limit (max 2)
            if (failingSubjects.length > 2) {
                console.log(`[GRACE] Disqualified: Student ${student_id} has ${failingSubjects.length} failures (limit 2).`);
                if (!externalClient) await activeClient.query('COMMIT');
                return 0;
            }

            // Rule 2: No internal failures allowed in the failing subjects
            const hasInternalFail = failingSubjects.some(m => Number(m.calculated_internal) <= 0);
            if (hasInternalFail) {
                console.log(`[GRACE] Disqualified: Student ${student_id} has internal failures.`);
                if (!externalClient) await activeClient.query('COMMIT');
                return 0;
            }

            // Rule 3: Single subject gap cap & Total budget
            const maxGracePerSubject = Number(config.max_per_subject_grace) || 0;
            let totalGraceNeeded = 0;
            let withinCaps = true;
            
            for (const m of failingSubjects) {
                const gap = passThreshold - Number(m.projected_total_marks);
                if (gap > maxGracePerSubject) withinCaps = false;
                totalGraceNeeded += gap;
            }

            if (!withinCaps || totalGraceNeeded > graceBudget) {
                console.log(`[GRACE] Disqualified: Needed ${totalGraceNeeded}, Budget ${graceBudget}, WithinCaps ${withinCaps}.`);
                if (!externalClient) await activeClient.query('COMMIT');
                return 0;
            }

            // 7. Apply New Grace Marks
            for (const m of failingSubjects) {
                const gap = passThreshold - Number(m.projected_total_marks);
                const oldTotal = m.total_marks;
                const finalTotal = Number(m.projected_total_marks) + gap;

                await activeClient.query(`
                    UPDATE marks 
                    SET grace_marks = $1::numeric, 
                        total_marks = $3::numeric,
                        status = 'Pass',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [gap, m.id, finalTotal]);
                
                if (user_id) {
                    await activeClient.query(`
                        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        user_id, 'APPLY_GRACE', 'marks', m.id, 
                        JSON.stringify({ total_marks: oldTotal, status: m.status }), 
                        JSON.stringify({ total_marks: finalTotal, status: 'Pass', grace_marks: gap, exam_series: exam_name })
                    ]);
                }
            }

            if (!externalClient) {
                await activeClient.query('COMMIT');
                console.log(`[GRACE] Success: Applied ${totalGraceNeeded} total grace marks to student ${student_id}.`);
            }
            return totalGraceNeeded;

        } catch (err) {
            if (!externalClient) await activeClient.query('ROLLBACK');
            console.error(`[GRACE ERROR] Student ${student_id}:`, err);
            throw err;
        } finally {
            if (internalClient) internalClient.release();
        }

    } catch (error) {
        console.error(`[GRACE ERROR] Failed for student ${student_id}:`, error);
        return 0;
    }
}

module.exports = { applyGraceMarks };
