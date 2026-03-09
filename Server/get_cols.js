const fs = require('fs');
const client = require('./db.js');

async function run() {
    try {
        const tables = ['faculty_subjects', 'students', 'subjects', 'master_subjects', 'sections', 'colleges'];
        let out = {};
        for (const table of tables) {
            const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
            out[table] = res.rows.map(r => `${r.column_name} (${r.data_type})`);
        }
        fs.writeFileSync('cols.json', JSON.stringify(out, null, 2));
        console.log("Written to cols.json")
    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
