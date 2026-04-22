const db = require('../../Server/db');

async function fix() {
    try {
        console.log('--- Starting Database Fix ---');

        // 1. Identify and Drop existing foreign keys on calculated_internal_marks
        const constraintsRes = await db.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'calculated_internal_marks'::regclass 
            AND contype = 'f'
        `);
        
        for (let row of constraintsRes.rows) {
            console.log(`Dropping constraint: ${row.conname}`);
            await db.query(`ALTER TABLE calculated_internal_marks DROP CONSTRAINT "${row.conname}"`);
        }

        // 2. Add the CORRECT foreign keys
        console.log('Adding correct FK to master_subjects(id)...');
        await db.query(`
            ALTER TABLE calculated_internal_marks 
            ADD CONSTRAINT fk_calculated_subject 
            FOREIGN KEY (subject_id) REFERENCES master_subjects(id)
        `);

        console.log('Adding correct FK to students(id)...');
        await db.query(`
            ALTER TABLE calculated_internal_marks 
            ADD CONSTRAINT fk_calculated_student 
            FOREIGN KEY (student_id) REFERENCES students(id)
        `);

        // 3. Double check the college_id FK as well (just in case)
        console.log('Adding correct FK to colleges(id)...');
        await db.query(`
            ALTER TABLE calculated_internal_marks 
            ADD CONSTRAINT fk_calculated_college 
            FOREIGN KEY (college_id) REFERENCES colleges(id)
        `);

        console.log('--- DATABASE FIX SUCCESS ---');

    } catch (err) {
        console.error('--- DATABASE FIX FAILED ---');
        console.error(err.message);
    } finally {
        process.exit(0);
    }
}

fix();
