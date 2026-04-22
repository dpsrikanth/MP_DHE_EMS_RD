const db = require('../../db');

async function check() {
  try {
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shortage_requests'
      ORDER BY ordinal_position
    `);
    console.log("Columns:", JSON.stringify(columns.rows, null, 2));

    const sample = await db.query("SELECT * FROM shortage_requests LIMIT 1");
    console.log("Sample Data:", JSON.stringify(sample.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
