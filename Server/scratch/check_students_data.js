require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkStudents() {
    try {
        const students = await db.query('SELECT "programName", semister, COUNT(*) FROM students GROUP BY "programName", semister');
        console.log('Students grouped by program and semester:', students.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudents();
