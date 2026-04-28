const db = require('./db');
async function run() {
  const r = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'exams'");
  console.log(r.rows.map(row => row.column_name));
  process.exit();
}
run();
