const db = require('./db.js');
async function run() {
    try {
        const res = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Public tables:', res.rows.map(r => r.table_name).join(', '));
        
        const cols = await db.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND (column_name ILIKE '%roll%' OR column_name ILIKE '%student%')
        `);
        console.log('Columns matching roll/student:');
        cols.rows.forEach(r => console.log(`- ${r.table_name}.${r.column_name}`));
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
