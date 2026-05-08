require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkBTechExams() {
    try {
        const exams = await db.query(`
            SELECT e.id, e.name, e.program_id, e.semester_id, mp.name as program_name, ms.semester_name
            FROM exams e
            LEFT JOIN master_programs mp ON e.program_id = mp.id
            LEFT JOIN master_semesters ms ON e.semester_id = ms.id
            WHERE e.name ILIKE '%BTech%' OR mp.name ILIKE '%BTech%'
        `);
        console.log('BTech Exams:', exams.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBTechExams();
