require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function main() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'component_acceptance';
        `);
        console.log("Columns of component_acceptance:");
        console.log(res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

main();
