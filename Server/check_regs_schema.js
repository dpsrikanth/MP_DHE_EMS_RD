const client = require('./db');

async function run() {
    try {
        console.log("--- Checking Exam Registrations Structure ---");
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
        `);
        console.table(cols.rows);

        console.log("\n--- Checking Data Samples ---");
        const regs = await client.query(`
            SELECT * FROM exam_registrations LIMIT 10
        `);
        console.table(regs.rows);

        const counts = await client.query(`
            SELECT payment_status, count(*) 
            FROM exam_registrations 
            GROUP BY payment_status
        `);
        console.table(counts.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
