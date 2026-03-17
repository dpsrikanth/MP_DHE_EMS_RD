const client = require('./db');

async function check() {
    try {
        console.log("--- Marks Table Columns ---");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks'
        `);
        console.table(res.rows);

        console.log("\n--- Students Table Columns ---");
        const sRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students'
        `);
        console.table(sRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
