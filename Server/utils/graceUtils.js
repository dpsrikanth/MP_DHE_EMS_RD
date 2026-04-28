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

        if (!policy || !policy.is_enabled) return;

        // 2. Fetch all marks for this student in this exam series
        const marksRes = await db.query(`
            SELECT m.*, sub.name as subject_name
            FROM marks m
            JOIN master_subjects sub ON m.subject_id = sub.id
            JOIN exams e ON m.exam_id = e.id
            WHERE m.student_id = $1 AND e.name = $2
            ORDER BY m.total_marks DESC
        `, [student_id, exam_name]);

        const marks = marksRes.rows;
        let totalGraceUsed = 0;
        const maxTotalGrace = policy.max_total_grace || 0;
        const maxPerSubjectGrace = policy.max_per_subject_grace || 0;

        // Filter subjects that are failing
        const failingSubjects = marks.filter(m => Number(m.total_marks) < passThreshold);
        
        // Sort by how close they are to passing (ascending gap)
        failingSubjects.sort((a, b) => (passThreshold - Number(a.total_marks)) - (passThreshold - Number(b.total_marks)));

        for (const m of failingSubjects) {
            const gap = passThreshold - Number(m.total_marks);
            
            // Check if this subject can be saved within per-subject limit and remaining total budget
            if (gap <= maxPerSubjectGrace && (totalGraceUsed + gap) <= maxTotalGrace) {
                const oldTotal = m.total_marks;
                const newTotal = Number(m.total_marks) + gap;

                // Apply grace
                await db.query(`
                    UPDATE marks 
                    SET grace_marks = $1, 
                        total_marks = total_marks + $1,
                        status = 'Pass',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [gap, m.id]);
                
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
