const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name IN ('student_internal_marks', 'internal_marks_structure', 'marks_workflow_status')
            ORDER BY table_name, ordinal_position;
        `);
        console.log("Schema dump:");
        res.rows.forEach(r => {
            console.log(`${r.table_name}.${r.column_name} : ${r.data_type}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
