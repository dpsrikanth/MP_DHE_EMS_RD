const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '172.16.0.225',
  database: process.env.DB_NAME || 'emsdb',
  password: process.env.DB_PASSWORD || '!ntense@225',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // Adding columns
    const alterQuery = `
      ALTER TABLE master_teachers 
        ADD COLUMN IF NOT EXISTS employee_category_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
        ADD COLUMN IF NOT EXISTS employee_position_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS employee_department_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS employee_grade_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS experience_detail VARCHAR(255),
        ADD COLUMN IF NOT EXISTS experience_months INTEGER,
        ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
        ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20),
        ADD COLUMN IF NOT EXISTS country_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS home_address_line1 VARCHAR(255),
        ADD COLUMN IF NOT EXISTS home_city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS home_state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS home_country_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS office_phone1 VARCHAR(50),
        ADD COLUMN IF NOT EXISTS office_phone2 VARCHAR(50),
        ADD COLUMN IF NOT EXISTS office_state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS home_phone1 VARCHAR(50),
        ADD COLUMN IF NOT EXISTS email VARCHAR(100),
        ADD COLUMN IF NOT EXISTS fax VARCHAR(50)
      ;
    `;
    console.log("Adding columns to master_teachers...");
    await client.query(alterQuery);
    console.log("Columns added successfully!");

    // Insert user first
    const userInsertQuery = `
      INSERT INTO users (
        name,
        email,
        password,
        role_id,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'JAINENDRA HARODE',
        'jainendraharode@gmail.com',
        '$2b$10$S9dWe./1fNnt2K/r0vOoV.5s.IfSvyY5T.S/k0qZ6d8V7nC8H3w5K', -- hashed password for "password"
        2, -- assuming 2 is faculty based on prior context, but might need checking
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING id;
    `;
    
    // We will do a quick check if this entry already exists to prevent duplicate inserts on rerun
    const checkUserQuery = `SELECT id FROM users WHERE email = 'jainendraharode@gmail.com'`;
    let userRes = await client.query(checkUserQuery);
    let userId;

    if (userRes.rows.length === 0) {
      console.log("Creating user for JAINENDRA HARODE...");
      userRes = await client.query(userInsertQuery);
      userId = userRes.rows[0].id;
      console.log("User created successfully with ID:", userId);
    } else {
      userId = userRes.rows[0].id;
      console.log("User already exists with ID:", userId);
    }


    // Insert sample record
    const insertQuery = `
      INSERT INTO master_teachers (
        user_id, designation_id, department_id, college_id, employee_category_name, employee_code, joining_date, first_name, 
        last_name, gender, job_title, employee_position_name, employee_department_name, 
        dob, experience_months, marital_status, blood_group, country_name, home_country_name, 
        office_phone1, email
      ) VALUES (
        $1, 15, 73, 5, 'Non Teaching', '14E002', '2013-03-25', 'JAINENDRA',
        'HARODE', 'Male', 'Asst. Programmer', 'Asst. Programmer', 'ICT Cell',
        '1986-08-01', 0, 'Married', 'O+', 'INDIA', 'INDIA',
        '9424371586', 'jainendraharode@gmail.com'
      ) RETURNING id;
    `;
    const checkQuery = `SELECT id FROM master_teachers WHERE employee_code = '14E002'`;
    const checkRes = await client.query(checkQuery);
    
    if (checkRes.rows.length === 0) {
      console.log("Inserting sample record 'JAINENDRA HARODE'...");
      const res = await client.query(insertQuery, [userId]);
      console.log("Sample record inserted successfully with ID:", res.rows[0].id);
    } else {
      console.log("Sample record already exists with ID:", checkRes.rows[0].id);
    }

  } catch (err) {
    console.error("Error executing query", err);
    throw err;
  } finally {
    await client.end();
  }
}

async function runWithRetry(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await run();
      break;
    } catch(e) {
      if (e.code === 'ETIMEDOUT' && i < retries - 1) {
        console.log(`Connection timed out, retrying in 5 seconds... (Attempt ${i+1}/${retries})`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        console.log("Failed after max retries or non-retriable error.");
      }
    }
  }
}

runWithRetry();
