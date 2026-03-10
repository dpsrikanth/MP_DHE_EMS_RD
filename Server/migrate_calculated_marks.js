const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function migrate() {
    try {
        console.log('--- Starting Migration for calculated_internal_marks ---');
        
        // 1. Add columns if they don't exist
        await pool.query(`
            ALTER TABLE calculated_internal_marks 
            ADD COLUMN IF NOT EXISTS college_id INTEGER,
            ADD COLUMN IF NOT EXISTS semester_id INTEGER,
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER;
        `);
        console.log('Columns added (if they were missing).');

        // 2. Add foreign keys (using master tables as reference if they exist)
        // We'll check if they reference master tables first or just add them as is for now to avoid FK errors if data is missing.
        
        // 3. Add UNIQUE constraint to support ON CONFLICT
        // First drop existing if any (unlikely based on my check but for safety)
        try {
            await pool.query(`ALTER TABLE calculated_internal_marks DROP CONSTRAINT IF EXISTS uk_calculated_internal_marks;`);
        } catch (e) {}

        await pool.query(`
            ALTER TABLE calculated_internal_marks 
            ADD CONSTRAINT uk_calculated_internal_marks 
            UNIQUE (student_id, subject_id, college_id, semester_id, academic_year_id);
        `);
        console.log('Unique constraint uk_calculated_internal_marks added.');

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
