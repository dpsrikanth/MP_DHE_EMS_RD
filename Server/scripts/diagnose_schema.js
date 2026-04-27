const client = require('../db');
async function run() {
    try {
        const tables = ['exams', 'exam_registrations', 'marks'];
        for (const t of tables) {
            console.log('--- ' + t.toUpperCase() + ' ---');
            const res = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [t]);
            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

