const pool = require('./db');
pool.query("SELECT id, name, email FROM users WHERE name ILIKE '%Anil Kumar%'").then(r => {
  console.log('--- Anil Kumar ---');
  console.table(r.rows);
  process.exit();
});
