const client = require('./db');

async function checkDb() {
  try {
    const roles = await client.query("SELECT * FROM roles");
    console.log("Roles:", roles.rows);

    const universities = await client.query("SELECT * FROM universities");
    console.log("Universities:", universities.rows);

    const admins = await client.query("SELECT id, name, email, role_id, university_id FROM users WHERE email LIKE '%admin%'");
    console.log("Admin Users:", admins.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkDb();
