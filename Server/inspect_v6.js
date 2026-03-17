const client = require('./db');

async function inspect() {
    try {
        console.log("--- Exams Table Columns ---");
        const eCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'exams'");
        eCols.rows.forEach(r => console.log(r.column_name));

        console.log("\n--- Checking relationship logic ---");
        // Are subjects linked to exams 1:1 or 1:N?
        // Let's see some data from exams
        const eData = await client.query("SELECT * FROM exams LIMIT 5");
        console.table(eData.rows);

        console.log("\n--- Checking marks table data ---");
        const mData = await client.query("SELECT * FROM marks LIMIT 5");
        console.table(mData.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspect();
