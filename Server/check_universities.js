const db = require('./db');

async function checkUniversities() {
  try {
    const info = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'universities'
    `);
    console.log(JSON.stringify(info.rows, null, 2));
    
    const count = await db.query('SELECT COUNT(*) FROM universities');
    console.log("University Count:", count.rows[0].count);
    
    if (parseInt(count.rows[0].count) > 0) {
        const samples = await db.query('SELECT * FROM universities LIMIT 5');
        console.log("Samples:", JSON.stringify(samples.rows, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUniversities();
