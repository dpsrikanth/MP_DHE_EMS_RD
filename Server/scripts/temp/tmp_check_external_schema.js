const client = require('../../Server/db');
async function run() {
    try {
        const tables = ['external_exams', 'external_exam_marks', 'exam_registrations', 'marks'];
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [table]);
            console.log(`\n--- TABLE: ${table} ---`);
            console.log(JSON.stringify(res.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
