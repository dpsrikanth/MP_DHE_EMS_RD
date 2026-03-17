const client = require('./db');

async function check() {
    try {
        const res = await client.query(`
            SELECT id, name, subject_id, academic_year_id, semester_id 
            FROM exams 
            ORDER BY name, id
        `);
        console.log("--- ALL EXAMS ---");
        res.rows.forEach(r => {
            console.log(`${r.id} | ${r.name} | Sub: ${r.subject_id} | AY: ${r.academic_year_id} | Sem: ${r.semester_id}`);
        });
        console.log("--- END ---");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
