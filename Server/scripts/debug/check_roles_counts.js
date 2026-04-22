const client = require('../../db');
async function run() {
  try {
    const user = await client.query("SELECT role_id FROM users WHERE email = 'admin@example.com'");
    const roleId = user.rows[0]?.role_id;
    const role = await client.query("SELECT role_name FROM roles WHERE id = $1", [roleId]);
    console.log('USER_ROLE:', role.rows[0]?.role_name);
    
    const allRoles = await client.query("SELECT id, role_name FROM roles");
    console.log('ALL_ROLES:', JSON.stringify(allRoles.rows, null, 2));

    const counts = await client.query(`
      SELECT c.name, COUNT(t.id) as teacher_count, c.university_id 
      FROM teachers t 
      JOIN colleges c ON t.college_id = c.id 
      GROUP BY c.name, c.university_id
    `);
    console.log('TEACHER_COUNTS_BY_COLLEGE:', JSON.stringify(counts.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
