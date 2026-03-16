const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function migrate() {
    try {
        console.log("Connecting...");
        await client.connect();
        console.log("Adding columns...");
        await client.query("ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_time VARCHAR(20)");
        await client.query("ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_time VARCHAR(20)");
        console.log("Columns added successfully!");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

migrate();
