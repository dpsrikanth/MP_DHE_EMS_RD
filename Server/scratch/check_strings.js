require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkStrings() {
    try {
        const students = await db.query('SELECT DISTINCT "programName", LENGTH("programName"), semister, LENGTH(semister) FROM students');
        console.log('Unique string lengths:', students.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStrings();
