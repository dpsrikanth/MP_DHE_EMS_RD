const client = require('./db.js');

async function checkStudents() {
  try {
    const res = await client.query('SELECT id, name, semister, "programName", "collageName" FROM students LIMIT 5;');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

setTimeout(checkStudents, 1000);
