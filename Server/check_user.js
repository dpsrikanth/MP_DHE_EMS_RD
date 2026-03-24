const pool = require('./db');

async function checkUser() {
  const email = 'john@gmail.com';
  try {
    const res = await pool.query("SELECT id, name, email FROM users WHERE email = $1", [email]);
    console.log(`--- Exact match for ${email} ---`);
    console.table(res.rows);

    const res2 = await pool.query("SELECT id, name, email FROM users WHERE email ILIKE $1", [email]);
    console.log(`--- ILIKE match for ${email} ---`);
    console.table(res2.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkUser();
