const db = require('../../Server/db');

async function test() {
    try {
        console.log("Connecting to DB...");
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            console.log("Attempting INSERT...");
            const query = `
                INSERT INTO calculated_internal_marks 
                (student_id, subject_id, college_id, semester_id, academic_year_id, best_of_3_score, practical_score, total_internal, passing_status) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                ON CONFLICT (student_id, subject_id, college_id, semester_id, academic_year_id) 
                DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            `;
            await client.query(query, [1, 13, 1, 1, 1, 15, 8, 23, 'Pass']);
            console.log("INSERT calculated_internal_marks SUCCESS");

            console.log("Attempting workflow status update...");
            const statusQuery = `
                INSERT INTO marks_workflow_status 
                (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
                VALUES ($1, $2, $3, $4, $5, 'Locked', $6) 
                ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
                DO UPDATE SET status = 'Locked'
                RETURNING id
            `;
            const statusRes = await client.query(statusQuery, [1, 13, 1, 1, 'A', 'Locked', 1]);
            const workflowId = statusRes.rows[0].id;
            console.log("INSERT marks_workflow_status SUCCESS, id:", workflowId);

            console.log("Attempting audit log...");
            await client.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'MARKS_LOCKED', 'MARKS_WORKFLOW', $2)`, [1, workflowId]);
            console.log("INSERT audit_logs SUCCESS");

            await client.query('ROLLBACK');
            console.log("Simulation SUCCESS (rolled back)");
        } catch (e) {
            console.error("DB ERROR:", e.message);
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("CONNECTION ERROR:", e.message);
    } finally {
        process.exit(0);
    }
}

test();
