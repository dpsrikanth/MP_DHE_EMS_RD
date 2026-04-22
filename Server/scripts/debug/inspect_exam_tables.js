const client = require('../../db');
async function run() {
    try {
        const tables = ['exams', 'exam_types', 'external_exams'];
        for (const table of tables) {
            const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
            console.log(`--- ${table.toUpperCase()} TABLE ---`);
            console.log(JSON.stringify(res.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
