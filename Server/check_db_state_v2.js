const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
  connectionTimeoutMillis: 5000,
});

async function checkDb() {
  let client;
  try {
    client = await pool.connect();
    const roles = await client.query("SELECT * FROM roles");
    console.log("Roles:", JSON.stringify(roles.rows));

    const universities = await client.query("SELECT * FROM universities");
    console.log("Universities:", JSON.stringify(universities.rows));

    const admins = await client.query("SELECT id, name, email, role_id, university_id FROM users WHERE email LIKE '%admin%'");
    console.log("Admin Users:", JSON.stringify(admins.rows));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
    process.exit(0);
  }
}

checkDb();
