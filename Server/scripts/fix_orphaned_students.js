require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', host: '172.16.0.225', database: 'emsdb', password: '!ntense@225', port: 5432,
});

async function fixStudents() {
    const client = await pool.connect();
    try {
        // 1. Find the most common college name in the table (likely the one the admin belongs to)
        const nameRes = await client.query('SELECT "collageName", COUNT(*) FROM students WHERE "collageName" IS NOT NULL GROUP BY "collageName" ORDER BY COUNT(*) DESC LIMIT 1');
        if (nameRes.rows.length === 0) return console.log("No college name found to assign.");
        
        const targetCollege = nameRes.rows[0].collageName;
        console.log(`Assigning orphaned students to: ${targetCollege}`);

        // 2. Update students where collageName is NULL
        const updateRes = await client.query('UPDATE students SET "collageName" = $1 WHERE "collageName" IS NULL', [targetCollege]);
        console.log(`Updated ${updateRes.rowCount} records.`);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

fixStudents();
