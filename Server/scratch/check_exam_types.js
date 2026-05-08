require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkExamTypes() {
    try {
        const types = await db.query('SELECT id, type_name FROM exam_types');
        console.log('Exam Types:', types.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkExamTypes();
