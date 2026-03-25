const pool = require('./db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'paper_assignments'")
  .then(res => {
    console.log(res.rows.map(r => r.column_name).join(','));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
