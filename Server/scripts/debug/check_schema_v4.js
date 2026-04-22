const client = require('../../db');

async function checkSchema() {
    try {
        console.log("--- Exam Registrations Columns ---");
        const erCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
        `);
        console.table(erCols.rows);

        console.log("\n--- Exams Columns ---");
        const eCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams'
        `);
        console.table(eCols.rows);

        console.log("\n--- Marks Columns ---");
        const mCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks'
        `);
        console.table(mCols.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkSchema();
