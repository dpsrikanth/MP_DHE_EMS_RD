const client = require('./db');
client.query('SELECT id, name, email, "deleteStatus" FROM students')
  .then(res => {
     console.log('Students in database:');
     console.table(res.rows);
     process.exit(0);
  })
  .catch(err => {
     console.error(err);
     process.exit(1);
  });
