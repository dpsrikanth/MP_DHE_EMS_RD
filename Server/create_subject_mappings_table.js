const pool = require('./db');

const createTableSql = `
CREATE TABLE IF NOT EXISTS master_subject_mappings (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES master_programs(id),
    semester_id INTEGER REFERENCES master_semesters(id),
    subject_id INTEGER REFERENCES master_subjects(id),
    is_mandatory VARCHAR(1) DEFAULT 'M', -- 'M' or 'E'
    has_examination BOOLEAN DEFAULT TRUE,
    periods_per_week INTEGER DEFAULT 1,
    teacher_id INTEGER REFERENCES master_teachers(id),
    mapping_type VARCHAR(50) DEFAULT 'Major', -- e.g. Major, English Literature in image
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_msm_program ON master_subject_mappings(program_id);
CREATE INDEX IF NOT EXISTS idx_msm_semester ON master_subject_mappings(semester_id);
CREATE INDEX IF NOT EXISTS idx_msm_subject ON master_subject_mappings(subject_id);
`;

async function run() {
  try {
    console.log('Connecting to database...');
    
    await pool.query(createTableSql);
    console.log('Table master_subject_mappings created or already exists');

    // Add sample data if empty
    const check = await pool.query('SELECT id FROM master_subject_mappings LIMIT 1');
    if (check.rows.length === 0) {
      // Find IDs for seed data
      const prog = await pool.query('SELECT id FROM master_programs LIMIT 1');
      const sem = await pool.query('SELECT id FROM master_semesters LIMIT 1');
      const sub = await pool.query('SELECT id FROM master_subjects LIMIT 1');
      const tea = await pool.query('SELECT id FROM master_teachers LIMIT 1');

      if (prog.rows[0] && sem.rows[0] && sub.rows[0]) {
        await pool.query(
          `INSERT INTO master_subject_mappings (program_id, semester_id, subject_id, teacher_id, mapping_type, is_mandatory, has_examination, periods_per_week)
           VALUES ($1, $2, $3, $4, 'Major', 'M', TRUE, 6)`,
          [prog.rows[0].id, sem.rows[0].id, sub.rows[0].id, tea.rows[0]?.id || null]
        );
        console.log('Sample mapping record inserted');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
