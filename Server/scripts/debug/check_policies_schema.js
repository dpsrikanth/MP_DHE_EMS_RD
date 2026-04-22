const db = require('../../db');

async function checkSchema() {
  try {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Tables found:", tables.rows.map(r => r.table_name));
    
    for (const tableName of ['master_policies', 'university_master_policies', 'college_master_policies']) {
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
