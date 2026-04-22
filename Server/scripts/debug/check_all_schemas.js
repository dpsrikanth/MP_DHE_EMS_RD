const client = require('../../db');

async function run() {
    try {
        console.log("--- Exams Table Columns ---");
        const examCols = await client.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'exams'
        `);
        console.table(examCols.rows);

        console.log("\n--- Exam Registrations Table Columns ---");
        const regCols = await client.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'exam_registrations'
        `);
        console.table(regCols.rows);

        console.log("\n--- Marks Table Columns ---");
        const markCols = await client.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'marks'
        `);
        console.table(markCols.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
