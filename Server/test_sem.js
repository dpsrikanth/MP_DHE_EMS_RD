const client = require('./db');

async function test() {
  try {
    await client.connect();
  } catch(e) {}
  
  try {
    const res = await client.query('SELECT id, semester_name FROM master_semesters ORDER BY id');
    console.log("Master Semesters:", res.rows);
    
    const res2 = await client.query('SELECT id, name, duration_years FROM master_programs');
    console.log("Master Programs:", res2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

test();
