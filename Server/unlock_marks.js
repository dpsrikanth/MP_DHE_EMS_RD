const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function unlock() {
    try {
        console.log('--- Unlocking Marks for Subject 6, Section A (Operation System) ---');
        
        // 1. Reset workflow status to Pending
        await pool.query(`
            UPDATE marks_workflow_status 
            SET status = 'Pending', approved_by = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE subject_id = 6 AND section = 'A'
        `);
        console.log('Workflow status reset to Pending.');

        // 2. Delete individual student reviews
        await pool.query(`
            DELETE FROM student_marks_review 
            WHERE subject_id = 6 AND section = 'A'
        `);
        console.log('Student reviews cleared.');

        // 3. Delete calculated marks
        await pool.query(`
            DELETE FROM calculated_internal_marks 
            WHERE subject_id = 6
        `);
        console.log('Calculated marks cleared.');

        console.log('Marks successfully unlocked for testing.');

    } catch (err) {
        console.error('Unlock failed:', err.message);
    } finally {
        await pool.end();
    }
}

unlock();
