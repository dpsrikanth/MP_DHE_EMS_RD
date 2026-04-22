const client = require('../../db');

async function check() {
    try {
        console.log("--- exam_registrations Schema ---");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
            ORDER BY ordinal_position
        `);
        console.table(res.rows);

        console.log("\n--- exams Schema ---");
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams'
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
