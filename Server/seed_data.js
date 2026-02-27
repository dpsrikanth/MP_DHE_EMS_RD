const client = require('./db');

async function seedData() {
  try {

    // Insert a university if none exists
    const checkUni = await client.query("SELECT * FROM universities LIMIT 1");
    let uniId;
    if (checkUni.rows.length === 0) {
      const uniRes = await client.query(
        "INSERT INTO universities (name, address) VALUES ($1, $2) RETURNING id",
        ['Global Default University', '123 Main St']
      );
      uniId = uniRes.rows[0].id;
      console.log('Inserted default university with ID:', uniId);
    } else {
      uniId = checkUni.rows[0].id;
      console.log('University already exists:', uniId);
    }

    // Insert a college if none exists
    const checkCol = await client.query("SELECT * FROM colleges LIMIT 1");
    if (checkCol.rows.length === 0) {
      const colRes = await client.query(
        "INSERT INTO colleges (name, university_id, address) VALUES ($1, $2, $3) RETURNING id",
        ['Main Campus College', uniId, '123 Main St']
      );
      console.log('Inserted default college with ID:', colRes.rows[0].id);
    } else {
      console.log('College already exists:', checkCol.rows[0].id);
    }

    // Insert user and student/teacher if none exists
    const checkUser = await client.query("SELECT * FROM users LIMIT 1");
    if (checkUser.rows.length === 0) {
      const roleRes = await client.query("SELECT id FROM roles WHERE role_name = 'admin' LIMIT 1");
      const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : null;
      
      const userRes = await client.query(
        "INSERT INTO users (name, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id",
        ['Admin User', 'admin@example.com', 'admin123', roleId]
      );
      console.log('Inserted default user with ID:', userRes.rows[0].id);
    }

    // Re-run the master data insert to ensure it's there
    console.log('Ensuring master data is present...');
    await client.query(`
      INSERT INTO master_policies (name, description) VALUES
          ('NEP2020', 'National Education Policy 2020'),
          ('NEP2021', 'National Education Policy 2021 update'),
          ('XYZ', 'Previous Education Policy')
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO master_programs (name, duration_years) VALUES
          ('BSc', 3),
          ('BTech', 4),
          ('MCA', 2),
          ('MTech', 2)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO master_subjects (subject_code, name) VALUES
          ('MATH0123', 'Mathematics I'),
          ('PHY011', 'Physics I'),
          ('CHEM022', 'Chemistry I')
      ON CONFLICT (subject_code) DO NOTHING;

      INSERT INTO master_academic_years (year_name) VALUES
          ('2024-2025'),
          ('2025-2026'),
          ('2026-2027')
      ON CONFLICT (year_name) DO NOTHING;

      INSERT INTO master_semesters (semester_name) VALUES
          ('Semester 1'),
          ('Semester 2'),
          ('Semester 3'),
          ('Semester 4'),
          ('Semester 5'),
          ('Semester 6'),
          ('Semester 7'),
          ('Semester 8')
      ON CONFLICT (semester_name) DO NOTHING;

      INSERT INTO master_roles (role_name) VALUES
          ('CoE'),
          ('HOD'),
          ('Lecture'),
          ('AsstLect'),
          ('Pueon'),
          ('Prof'),
          ('AsstPro'),
          ('ComputerOper')
      ON CONFLICT (role_name) DO NOTHING;
    `);
    console.log('Master data synced.');

  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    process.exit(0);
  }
}

setTimeout(seedData, 500);
