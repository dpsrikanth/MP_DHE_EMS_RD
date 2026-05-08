require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function confirmBTechStudents() {
    try {
        const students = await db.query(`
            SELECT s.name, s."programName", s.semister, s."collageName"
            FROM students s
            JOIN colleges c ON s."collageName" ILIKE c.name
            WHERE c.name = 'Mp college' AND s."programName" ILIKE '%BTech%'
        `);
        console.log('BTech students in Mp college:', students.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

confirmBTechStudents();
