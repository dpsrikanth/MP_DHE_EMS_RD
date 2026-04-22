const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function verify() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('--- Verification Started ---');

    console.log('1. Checking Roles...');
    const roles = await client.query("SELECT role_name FROM roles WHERE role_name IN ('superadmin', 'university_admin')");
    console.log('Roles found:', roles.rows.map(r => r.role_name));

    console.log('2. Checking Superadmin user...');
    const superadmin = await client.query("SELECT email, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE email = 'superadmin@example.com'");
    console.log('Superadmin user:', superadmin.rows[0]);

    console.log('3. Checking Admin user isolation...');
    const admin = await client.query("SELECT email, r.role_name, university_id FROM users u JOIN roles r ON u.role_id = r.id WHERE email = 'admin@example.com'");
    console.log('Admin user:', admin.rows[0]);

    if (admin.rows[0] && admin.rows[0].university_id) {
       console.log('Admin user is successfully tied to university ID:', admin.rows[0].university_id);
    } else {
       console.log('WARNING: Admin user university_id is missing!');
    }

    console.log('--- Verification Finished ---');
  } catch (err) {
    console.error('Verification failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

verify();
