const pool = require('./db');

async function setupPaperWorkflow() {
  const client = await pool.connect();
  try {
    // Drop existing table if user wants a clean slate
    await client.query('DROP TABLE IF EXISTS question_papers CASCADE');
    await client.query('DROP TABLE IF EXISTS paper_assignments CASCADE');
    
    // Assignment table where HOD assigns sets to faculty
    await client.query(`
      CREATE TABLE paper_assignments (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER NOT NULL,
        exam_id INTEGER NOT NULL,
        set_name VARCHAR(10) NOT NULL, -- 'A', 'B', 'C'
        assigned_faculty_id INTEGER REFERENCES users(id),
        assigned_by_hod_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'Pending', -- Pending, Uploaded, Finalized
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (subject_id, exam_id, set_name)
      );
    `);

    // question_papers table storing actual encrypted payload
    await client.query(`
      CREATE TABLE question_papers (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES paper_assignments(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        setter_id INTEGER REFERENCES users(id),
        file_path VARCHAR(500) NOT NULL,
        iv VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Paper setter tables (HOD Workflow) created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupPaperWorkflow();
