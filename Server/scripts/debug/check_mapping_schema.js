const client = require('../../db');

async function check() {
    try {
        console.log("--- student_exam_subjects Schema ---");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'student_exam_subjects'
            ORDER BY ordinal_position
        `);
        console.table(res.rows);

        console.log("\n--- exam_subjects Schema ---");
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_subjects'
            ORDER BY ordinal_position
        `);
        console.table(res2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
