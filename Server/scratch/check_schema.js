require('dotenv').config({ path: './config/.env' });
const db = require('../config/db');

async function checkSchema() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams';
        `);
        console.log('Exams Columns:');
        console.table(res.rows);

        const res2 = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks';
        `);
        console.log('Marks Columns:');
        console.table(res2.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
