const pool = require('../../Server/db');

async function listExams() {
    try {
        console.log("Listing current exams in DB:");
        const res = await pool.query("SELECT id, name FROM exams ORDER BY id DESC LIMIT 10");
        console.table(res.rows);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        pool.end();
    }
}

listExams();
