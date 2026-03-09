const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name IN ('students', 'subjects', 'employees', 'faculty_subjects')
            ORDER BY table_name, ordinal_position;
        `);
        console.log("Schema dump:");
        res.rows.forEach(r => {
            console.log(`${r.table_name}.${r.column_name} : ${r.data_type}`);
        });

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log("\nAll tables:");
        console.log(tables.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
