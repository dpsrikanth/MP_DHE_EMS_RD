const client = require('../../db');

async function inspect() {
    try {
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("--- START TABLES ---");
        tables.rows.forEach(r => console.log(r.table_name));
        console.log("--- END TABLES ---");

        const efaCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'external_faculty_assignments'");
        console.log("--- START EFA COLS ---");
        efaCols.rows.forEach(r => console.log(r.column_name));
        console.log("--- END EFA COLS ---");

        const erCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'exam_registrations'");
        console.log("--- START ER COLS ---");
        erCols.rows.forEach(r => console.log(r.column_name));
        console.log("--- END ER COLS ---");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspect();
