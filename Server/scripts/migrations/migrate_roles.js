const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    console.log('--- Step 1: Adding Roles ---');
    await client.query(`
      INSERT INTO roles (role_name) 
      VALUES ('superadmin'), ('university_admin') 
      ON CONFLICT (role_name) DO NOTHING;
    `);

    console.log('--- Step 2: Ensuring MP University exists ---');
    let uniRes = await client.query("SELECT id FROM universities WHERE name = 'MP University'");
    let uniId;
    if (uniRes.rows.length === 0) {
      uniRes = await client.query(
        "INSERT INTO universities (name, address, status) VALUES ($1, $2, $3) RETURNING id",
        ['MP University', 'Madhya Pradesh', true]
      );
      uniId = uniRes.rows[0].id;
      console.log('Created MP University with ID:', uniId);
    } else {
      uniId = uniRes.rows[0].id;
      console.log('MP University already exists with ID:', uniId);
    }

    console.log('--- Step 3: Setting up Roles mapping ---');
    const roleRes = await client.query("SELECT id, role_name FROM roles");
    const roles = {};
    roleRes.rows.forEach(r => roles[r.role_name] = r.id);

    console.log('--- Step 4: Creating Superadmin User ---');
    const superadminPassword = await bcrypt.hash('superadmin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id
    `, ['Super Admin', 'superadmin@example.com', superadminPassword, roles['superadmin']]);
    console.log('Superadmin user setup complete.');

    console.log('--- Step 5: Updating admin@example.com to University Admin ---');
    await client.query(`
      UPDATE users 
      SET role_id = $1, university_id = $2 
      WHERE email = 'admin@example.com'
    `, [roles['university_admin'], uniId]);
    console.log('admin@example.com updated to university_admin for MP University.');

    await client.query('COMMIT');
    console.log('--- Migration Successful ---');

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
    process.exit(0);
  }
}

migrate();
