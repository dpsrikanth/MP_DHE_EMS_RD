const pool = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Create Student role in roles table if it doesn't exist
        const roleCheck = await pool.query("SELECT id FROM roles WHERE role_name = 'Student'");
        if (roleCheck.rows.length === 0) {
            console.log('Creating Student role...');
            await pool.query("INSERT INTO roles (role_name) VALUES ('Student')");
        } else {
            console.log('Student role already exists.');
        }

        // 2. Add user_id to students table
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'user_id'
        `);
        if (columnCheck.rows.length === 0) {
            console.log('Adding user_id column to students table...');
            await pool.query('ALTER TABLE students ADD COLUMN user_id INTEGER REFERENCES users(id)');
        } else {
            console.log('user_id column already exists in students table.');
        }

        // 3. Create exam_registrations table
        console.log('Creating exam_registrations table if it doesn\'t exist...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exam_registrations (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                exam_id INTEGER REFERENCES exams(id),
                payment_status VARCHAR(20) DEFAULT 'Pending',
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                transaction_id VARCHAR(100),
                amount NUMERIC(10, 2),
                UNIQUE(student_id, exam_id)
            )
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
