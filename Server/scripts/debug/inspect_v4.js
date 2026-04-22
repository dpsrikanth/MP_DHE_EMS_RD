const client = require('../../db');

async function inspect() {
    try {
        console.log("--- Tables in Public Schema ---");
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.table(tables.rows);

        console.log("\n--- Checking external_faculty_assignments Schema ---");
        const efaCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'external_faculty_assignments'
        `);
        console.table(efaCols.rows);

        console.log("\n--- Checking exam_registrations Schema ---");
        const erCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
        `);
        console.table(erCols.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspect();
