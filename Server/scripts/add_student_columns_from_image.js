require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Let's add the columns if they don't exist
        const columnsToAdd = [
            'admission_no VARCHAR(255)',
            'admission_date DATE',
            'first_name VARCHAR(255)',
            'middle_name VARCHAR(255)',
            'last_name VARCHAR(255)',
            'batch VARCHAR(255)',
            'section VARCHAR(255)',
            'date_of_birth DATE',
            'gender VARCHAR(50)',
            'student_status VARCHAR(255)',
            'rte VARCHAR(50)',
            'birth_place VARCHAR(255)',
            'hostel_or_day_scholar VARCHAR(50)',
            'country VARCHAR(100)',
            'state VARCHAR(100)',
            'city VARCHAR(100)',
            'pin_code VARCHAR(50)',
            'language VARCHAR(100)',
            'phone VARCHAR(50)',
            'sms_enabled VARCHAR(50)',
            'ems_enabled VARCHAR(50)',
            'father_first_name VARCHAR(255)',
            'father_last_name VARCHAR(255)',
            'father_mobile_phone VARCHAR(50)',
            'father_address_email VARCHAR(255)',
            'father_state VARCHAR(100)',
            'father_pin_code VARCHAR(50)',
            'mother_first_name VARCHAR(255)',
            'mother_last_name VARCHAR(255)',
            'mother_mobile_phone VARCHAR(50)',
            'mother_address_email VARCHAR(255)',
            'mother_state VARCHAR(100)',
            'mother_pin_code VARCHAR(50)',
            'address_line_1 TEXT'
        ];

        for (let colDef of columnsToAdd) {
            const colName = colDef.split(' ')[0];
            try {
                // Check if column exists
                const checkRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'students' 
                    AND column_name = $1
                `, [colName]);

                if (checkRes.rows.length === 0) {
                    await client.query(`ALTER TABLE students ADD COLUMN ${colDef}`);
                    console.log(`Added column ${colName}`);
                } else {
                    console.log(`Column ${colName} already exists`);
                }
            } catch (e) {
                console.error(`Error adding column ${colName}:`, e);
            }
        }

        // Now insert the sample record
        console.log("Inserting sample record...");
        const insertQuery = `
            INSERT INTO students (
                admission_no, admission_date, first_name, middle_name, last_name,
                batch, section, date_of_birth, gender, student_status, rte, birth_place,
                hostel_or_day_scholar, country, state, city, pin_code, language, phone,
                sms_enabled, ems_enabled, address_line_1,
                father_first_name, father_last_name, father_mobile_phone, father_address_email, father_state, father_pin_code,
                mother_first_name, mother_last_name, mother_mobile_phone, mother_address_email, mother_state, mother_pin_code,
                name, "contactNumber", email
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19,
                $20, $21, $22,
                $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34,
                $35, $36, $37
            ) RETURNING id
        `;

        // Using values straight from the image
        const values = [
            '25C00713', '2025-06-14', 'Aaban', '-', 'Imam',
            'I Year', 'Economics', '2006-09-21', 'Male', 'New Admission', 'NA', 'Bhopal',
            'Day Scholar', 'INDIA', 'M.P.', 'Bhopal', '462038', 'Hindi', '-',
            'NULL', 'NULL', 'G 202 NICE SPACE APARTMENT BADWAI BHOPAL 462038 MADHYA PRADESH',
            'Fazil', 'Imam', '9588984512', '-', 'M.P.', '462038',
            'Anam', 'Imam', '-', '-', 'M.P.', 'INDIA',
            'Aaban Imam', '9588984512', '-'
        ];

        const insertRes = await client.query(insertQuery, values);
        console.log(`Inserted sample record with ID ${insertRes.rows[0].id}`);

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in transaction:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();

