const db = require('./Server/db');

async function createHOD() {
    try {
        // 1. Ensure HOD role exists in 'roles' table
        await pool.query("INSERT INTO public.roles (role_name) VALUES ('HOD') ON CONFLICT (role_name) DO NOTHING");
        const roleRes = await pool.query("SELECT id FROM public.roles WHERE role_name = 'HOD'");
        const roleId = roleRes.rows[0].id;

        // 2. Get a college and department
        const colRes = await pool.query("SELECT id FROM colleges LIMIT 1");
        const depRes = await pool.query("SELECT id FROM master_departments LIMIT 1");

        if (colRes.rows.length === 0 || depRes.rows.length === 0) {
            console.log('Error: Need at least one college and one department to create an HOD.');
            return;
        }

        const collegeId = colRes.rows[0].id;
        const departmentId = depRes.rows[0].id;

        // 3. Create User
        const email = 'hod@example.com';
        const password = 'password123'; // Using plain password because controller allows it if no hash
        const name = 'Department Head';

        await pool.query("DELETE FROM users WHERE email = $1", [email]);
        const userRes = await pool.query(
            "INSERT INTO users (name, email, password, role_id, college_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [name, email, password, roleId, collegeId]
        );
        const userId = userRes.rows[0].id;

        // 4. Create Teacher record (HODs must be teachers)
        const empCode = 'HOD001';
        // Get a designation
        let desRes = await pool.query("SELECT id FROM master_designations LIMIT 1");
        if (desRes.rows.length === 0) {
            await pool.query("INSERT INTO master_designations (designation_name) VALUES ('Professor') ON CONFLICT DO NOTHING");
            desRes = await pool.query("SELECT id FROM master_designations LIMIT 1");
        }
        const designationId = desRes.rows[0].id;

        await pool.query("DELETE FROM master_teachers WHERE employee_code = $1", [empCode]);
        await pool.query(
            `INSERT INTO master_teachers (user_id, employee_code, designation_id, department_id, college_id, status) 
       VALUES ($1, $2, $3, $4, $5, 'Active')`,
            [userId, empCode, designationId, departmentId, collegeId]
        );

        console.log('HOD User Created Successfully:');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
        console.log('College ID: ' + collegeId);
        console.log('Department ID: ' + departmentId);

    } catch (err) {
        console.error('Error creating HOD:', err.message);
    } finally {
        pool.end();
    }
}

createHOD();
