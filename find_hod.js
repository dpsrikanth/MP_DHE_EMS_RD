const client = require('./Server/db');

async function findHOD() {
    try {
        const res = await client.query(`
      SELECT u.email, u.password, r.role_name 
      FROM public.users u 
      JOIN public.roles r ON u.role_id = r.id 
      WHERE r.role_name = 'HOD' 
      LIMIT 1
    `);

        if (res.rows.length > 0) {
            console.log('Found HOD User:');
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('No HOD user found in the "users" table.');
            // Check if maybe it's lowercase 'hod'
            const res2 = await pool.query("SELECT email, role_id FROM users LIMIT 20");
            console.log('Sample Users:', JSON.stringify(res2.rows, null, 2));
            const res3 = await pool.query("SELECT * FROM roles");
            console.log('Available Roles:', JSON.stringify(res3.rows, null, 2));
        }
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        pool.end();
    }
}

findHOD();
