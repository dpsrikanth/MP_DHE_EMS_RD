const pool = require('../../Server/db');

async function checkAllDuplicates() {
    try {
        const nameMatch = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        console.log(`Checking for duplicates of: ${nameMatch}`);
        const res = await pool.query("SELECT id FROM exams WHERE name = $1", [nameMatch]);
        
        console.log(`Found ${res.rows.length} duplicates: ${res.rows.map(r => r.id).join(', ')}`);
        
        for (const row of res.rows) {
            const id = row.id;
            const regCount = await pool.query("SELECT COUNT(*) FROM exam_registrations WHERE exam_id = $1", [id]);
            const marksCount = await pool.query("SELECT COUNT(*) FROM marks WHERE exam_id = $1", [id]);
            console.log(`ID ${id}: ${regCount.rows[0].count} registrations, ${marksCount.rows[0].count} marks`);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        pool.end();
    }
}

checkAllDuplicates();
