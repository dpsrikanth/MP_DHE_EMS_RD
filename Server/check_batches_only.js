const db = require('./db');

async function checkSchema() {
  try {
    for (const tableName of ['master_batches']) {
      const columns = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      console.log(`\n--- ${tableName} ---`);
      console.log(JSON.stringify(columns.rows, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
