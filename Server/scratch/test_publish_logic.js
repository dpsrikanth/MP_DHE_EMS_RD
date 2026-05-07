const db = require('../config/db');

async function test() {
    const exam_name = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
    try {
        const externalCheck = await db.query(`
            SELECT COUNT(DISTINCT e.subject_id) as total_subjects,
                   COUNT(DISTINCT efa.subject_id) FILTER (WHERE efa.status IN ('Submitted', 'Approved', 'Finalized')) as submitted_count,
                   -- My proposed fix:
                   COUNT(DISTINCT e.subject_id) FILTER (WHERE efa.status IN ('Submitted', 'Approved', 'Finalized')) as fixed_submitted_count
            FROM exams e
            LEFT JOIN external_faculty_assignments efa ON efa.exam_id = e.id 
              AND (efa.subject_id = e.subject_id OR efa.subject_id IS NULL)
            WHERE TRIM(e.name) ILIKE TRIM($1)
        `, [exam_name]);
        
        console.log("External Check Stats:", externalCheck.rows[0]);

        const workflowCheck = await db.query(`
            SELECT COUNT(*) as total, 
                   COUNT(*) FILTER (WHERE mws.status IN ('Locked', 'Finalized')) as locked
            FROM marks_workflow_status mws
            JOIN master_subjects sub ON mws.subject_id = sub.id
            WHERE sub.id IN (
                  SELECT subject_id FROM exams WHERE TRIM(name) ILIKE TRIM($1)
            )
        `, [exam_name]);
        console.log("Workflow Check Stats:", workflowCheck.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

test();
