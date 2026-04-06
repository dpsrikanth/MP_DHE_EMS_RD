const db = require('./db.js');
async function run() {
    try {
        const res = await db.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE column_name ILIKE '%rollnumber%'
            AND table_schema = 'public'
        `);
        console.log('Tables with rollnumber column:');
        res.rows.forEach(r => console.log(`- ${r.table_name}.${r.column_name}`));
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
