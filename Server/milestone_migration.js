const pool = require("./db");

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting Academic Milestones Migration...");
    
    await client.query("BEGIN");

    // Create Academic Milestones table
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_milestones (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        responsibility VARCHAR(100),
        type VARCHAR(50) DEFAULT 'General', -- Internal, External, General
        description TEXT,
        semester_id INTEGER,
        college_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delete_status BOOLEAN DEFAULT true
      );
    `);

    console.log("✅ Table 'academic_milestones' created/verified.");

    // Seed sample data from the user template if table is empty
    const checkData = await client.query("SELECT COUNT(*) FROM academic_milestones");
    if (parseInt(checkData.rows[0].count) === 0) {
      console.log("🌱 Seeding initial milestones from template...");
      
      const milestones = [
        ['Commencement of Classes', '2025-07-15', '2025-07-15', 'College Admin', 'General'],
        ['Internal Exam 1 (Mid-1)', '2025-08-25', '2025-08-30', 'College', 'Internal'],
        ['Internal Marks Entry (Mid-1)', '2025-09-01', '2025-09-05', 'Faculty', 'Internal'],
        ['Internal Exam 2 (Mid-2)', '2025-10-10', '2025-10-15', 'College', 'Internal'],
        ['Internal Marks Entry (Mid-2)', '2025-10-16', '2025-10-20', 'Faculty', 'Internal'],
        ['Internal Marks Approval', '2025-10-21', '2025-10-25', 'HOD', 'Internal'],
        ['Internal Marks Lock & Submission', '2025-10-26', '2025-10-30', 'College Admin', 'Internal'],
        ['Last Working Day', '2025-11-15', '2025-11-15', 'College', 'General'],
        ['External Exam Registration', '2025-10-20', '2025-10-30', 'University', 'External'],
        ['Hall Ticket Release', '2025-11-20', '2025-11-20', 'University', 'External'],
        ['External (End Semester) Exams', '2025-11-25', '2025-12-10', 'University', 'External'],
        ['Valuation of Answer Scripts', '2025-12-15', '2025-12-30', 'University', 'External'],
        ['Results Declaration', '2026-01-10', '2026-01-10', 'University', 'External']
      ];

      for (const m of milestones) {
        await client.query(
          "INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type) VALUES ($1, $2, $3, $4, $5)",
          m
        );
      }
      console.log("✅ Seed data inserted successfully.");
    }

    await client.query("COMMIT");
    console.log("🎉 Migration completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err.message);
  } finally {
    client.release();
    process.exit();
  }
};

migrate();
