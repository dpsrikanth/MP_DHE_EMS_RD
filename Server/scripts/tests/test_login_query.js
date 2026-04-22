const client = require('../../db');

async function testQuery() {
    try {
        const email = 'sriramkorla10@gmail.com';
        console.log(`Testing Login query for ${email}...`);
        
        const user = await client.query(
          `SELECT u.id, u.name, u.email, u.password, u.password_hash, 
                  COALESCE(mt.college_id, sc.id, u.college_id) as college_id, 
                  COALESCE(u.university_id, sc.university_id) as university_id, 
                  r.role_name, mt.id as teacher_id, mt.department_id 
           FROM public.users u 
           JOIN public.roles r ON u.role_id = r.id 
           LEFT JOIN public.master_teachers mt ON mt.user_id = u.id
           LEFT JOIN public.students s ON s.user_id = u.id
           LEFT JOIN public.colleges sc ON s."collageName" ILIKE sc.name
           WHERE u.email = $1`,
          [email]
        );

        if (user.rows.length === 0) {
            console.log('User not found.');
        } else {
            console.log('User found. Result:');
            console.table(user.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testQuery();
