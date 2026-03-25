const pool = require('./db');
pool.query("SELECT * FROM paper_assignments LIMIT 0")
  .then(res => {
    console.log(JSON.stringify(res.fields.map(f => f.name)));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
