const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function fixFK() {
    try {
        console.log('--- Fixing Foreign Key for calculated_internal_marks ---');
        
        // 1. Drop the incorrect FK constraint
        await pool.query(`
            ALTER TABLE calculated_internal_marks 
            DROP CONSTRAINT IF EXISTS calculated_internal_marks_subject_id_fkey;
        `);
        console.log('Dropped old constraint.');

        // 2. Add the correct FK constraint pointing to master_subjects
        await pool.query(`
            ALTER TABLE calculated_internal_marks 
            ADD CONSTRAINT calculated_internal_marks_subject_id_fkey 
            FOREIGN KEY (subject_id) REFERENCES master_subjects(id) ON DELETE CASCADE;
        `);
        console.log('Added correct constraint pointing to master_subjects.');

        console.log('Fix completed successfully.');

    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fixFK();
