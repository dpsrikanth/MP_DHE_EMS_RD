const fs = require('fs');
const client = require('../../db.js');

async function run() {
    try {
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        fs.writeFileSync('tables.json', JSON.stringify(res.rows.map(r => r.table_name), null, 2));
        console.log("Done");
    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
