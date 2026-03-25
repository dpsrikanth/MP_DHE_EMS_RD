const pool = require('./db');
const bcrypt = require('bcryptjs');

async function createSecrecyUser() {
  const client = await pool.connect();
  try {
    const roleRes = await client.query("SELECT id FROM roles WHERE role_name = 'Secrecy'");
    if (roleRes.rows.length === 0) {
      console.log("Secrecy role not found. Please run migrate_secrecy.js first.");
      return;
    }
    const roleId = roleRes.rows[0].id;

    const email = 'secrecy@ems.edu';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash;
    `, ['Secrecy Admin', email, hashedPassword, roleId]);

    console.log("Secrecy User Created Successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (err) {
    console.error("Error creating secrecy user:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

createSecrecyUser();
