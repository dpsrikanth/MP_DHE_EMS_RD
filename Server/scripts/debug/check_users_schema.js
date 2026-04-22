const db = require('../../db');

async function checkUsers() {
  try {
    const info = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log(JSON.stringify(info.rows, null, 2));
    
    // Also check colleges table for university_id
    const colInfo = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'colleges'
    `);
    console.log("\n--- Colleges ---");
    console.log(JSON.stringify(colInfo.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
