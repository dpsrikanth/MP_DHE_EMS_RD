const client = require('./db.js');

async function checkColumns() {
  try {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(checkColumns, 1000);
