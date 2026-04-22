const db = require('../../db');

async function checkRolesAndUsers() {
  try {
    const roles = await db.query("SELECT * FROM roles");
    console.log("Roles:", JSON.stringify(roles.rows, null, 2));
    
    const uniAdminRole = roles.rows.find(r => r.role_name.toLowerCase().includes('university'));
    if (uniAdminRole) {
        const users = await db.query("SELECT id, name, email, college_id FROM users WHERE role_id = $1", [uniAdminRole.id]);
        console.log("\n--- University Admin Users ---");
        console.log(JSON.stringify(users.rows, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRolesAndUsers();
