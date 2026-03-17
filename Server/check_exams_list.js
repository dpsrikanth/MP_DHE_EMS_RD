const client = require('./db');

async function check() {
    try {
        const res = await client.query(`
            SELECT id, name, subject_id, academic_year_id, semester_id 
            FROM exams 
            ORDER BY name, id
            LIMIT 50
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
