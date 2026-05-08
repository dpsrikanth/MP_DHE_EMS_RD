require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkData() {
    try {
        const exams = await db.query('SELECT id, name, program_id, semester_id FROM exams LIMIT 10');
        console.log('Exams:', exams.rows);

        const programs = await db.query('SELECT id, name FROM master_programs');
        console.log('Programs:', programs.rows);

        const semesters = await db.query('SELECT id, semester_name FROM master_semesters');
        console.log('Semesters:', semesters.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
