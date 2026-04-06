const pool = require('../db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Creating student_attendance table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id                SERIAL PRIMARY KEY,
        student_id        INTEGER NOT NULL REFERENCES students(id),
        subject_id        INTEGER NOT NULL,
        college_id        INTEGER REFERENCES colleges(id),
        semester_id       INTEGER,
        academic_year_id  INTEGER,
        teacher_id        INTEGER,
        attendance_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        period_number     INTEGER NOT NULL DEFAULT 1,
        status            VARCHAR(10) NOT NULL DEFAULT 'Present',
        section           VARCHAR(50),
        created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, subject_id, college_id, semester_id, attendance_date, period_number, section)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_subject_date
        ON student_attendance (subject_id, attendance_date, college_id, semester_id);
    `);

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
