const client = require('../../db');

async function run() {
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks'
            ORDER BY ordinal_position
        `);
        console.log("--- MARKS TABLE COLUMNS ---");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
