const client = require('../../db');

async function check() {
    try {
        console.log("--- exams Schema ---");
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams'
            ORDER BY ordinal_position
        `);
        res2.rows.forEach(r => console.log(`${r.column_name} | ${r.data_type}`));

        console.log("\n--- exam_registrations Schema ---");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
            ORDER BY ordinal_position
        `);
        res.rows.forEach(r => console.log(`${r.column_name} | ${r.data_type}`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
