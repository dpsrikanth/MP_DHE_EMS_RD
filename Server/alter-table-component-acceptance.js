require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function main() {
    try {
        await db.query(`
            ALTER TABLE component_acceptance ADD COLUMN IF NOT EXISTS unlock_reason TEXT;
        `);
        console.log("Successfully added column 'unlock_reason' to component_acceptance table.");
    } catch(e) {
        console.error("Migration error:", e);
    } finally {
        process.exit();
    }
}

main();
