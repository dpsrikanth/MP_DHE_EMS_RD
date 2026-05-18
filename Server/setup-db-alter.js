require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function setup() {
    try {
        await db.query(`
            ALTER TABLE student_mark_discrepancies 
            ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id),
            ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES master_semesters(id);
        `);
        console.log('Table altered successfully');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

setup();
