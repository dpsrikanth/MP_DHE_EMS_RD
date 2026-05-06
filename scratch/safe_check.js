const db = require('../Server/config/db');
async function check() {
  try {
    const res = await db.query('SELECT * FROM students LIMIT 1');
    if (res.rows.length > 0) {
      console.log('Columns:', Object.keys(res.rows[0]).join(', '));
    } else {
      console.log('Table is empty');
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
check();
