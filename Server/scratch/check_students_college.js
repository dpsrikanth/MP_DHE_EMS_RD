require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkStudentsCollege() {
    try {
        const students = await db.query(`
            SELECT s."programName", s.semister, s."collageName", c.id as college_id, c.name as official_college_name
            FROM students s
            JOIN colleges c ON s."collageName" ILIKE c.name
            WHERE s."programName" ILIKE '%BTech%' OR s."programName" ILIKE '%MCA%'
        `);
        console.log('Students and their resolved colleges:', students.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudentsCollege();
