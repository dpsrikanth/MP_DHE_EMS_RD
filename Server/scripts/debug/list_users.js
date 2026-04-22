const pool = require('../../db');
pool.query("SELECT id, name, email FROM users").then(r => {
  console.log('--- All Users ---');
  console.table(r.rows);
  process.exit();
});
