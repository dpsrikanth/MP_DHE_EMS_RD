const db = require('./db.js');
db.query('SELECT id, name, "programName", semister FROM students LIMIT 5').then(res => { console.log(res.rows); process.exit(0); });
