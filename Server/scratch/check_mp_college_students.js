require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkMpCollegeStudents() {
    try {
        const students = await db.query(`
            SELECT s."programName", s.semister, COUNT(*)
            FROM students s
            JOIN colleges c ON s."collageName" ILIKE c.name
            WHERE c.name = 'Mp college'
            GROUP BY s."programName", s.semister
        `);
        console.log('Students in Mp college:', students.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMpCollegeStudents();
