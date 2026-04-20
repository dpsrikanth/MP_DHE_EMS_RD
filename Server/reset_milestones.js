const pool = require("./db");

const resetMilestones = async () => {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting Final Phased Academic Milestones Reset (Registration -> Lock -> Enrollment)...");
    
    await client.query("BEGIN");

    // Clear existing milestones
    console.log("🧹 Truncating academic_milestones table...");
    await client.query("TRUNCATE TABLE academic_milestones RESTART IDENTITY");

    console.log("🌱 Seeding finalized roadmap (Practical -> Reg -> Lock -> Enroll -> Operational)...");
    
    const milestones = [
      ['Commencement of Classes', '2024-07-15', '2024-07-15', 'College Admin', 'General'],
      
      ['Internal Exam 1 (Mid-1)', '2024-08-15', '2024-08-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-1)', '2024-08-21', '2024-08-25', 'Faculty', 'Internal'],
      ['Internal Marks Approval (Mid-1)', '2024-08-26', '2024-08-30', 'HOD', 'Internal'],
      
      ['Internal Exam 2 (Mid-2)', '2024-09-15', '2024-09-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-2)', '2024-09-21', '2024-09-25', 'Faculty', 'Internal'],
      ['Internal Marks Approval (Mid-2)', '2024-09-26', '2024-09-30', 'HOD', 'Internal'],
      
      ['Internal Exam 3 (Mid-3)', '2024-10-15', '2024-10-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-3)', '2024-10-21', '2024-10-25', 'Faculty', 'Internal'],
      ['Internal Marks Approval (Mid-3)', '2024-10-26', '2024-10-30', 'HOD', 'Internal'],
      
      ['Practical Exam', '2024-11-01', '2024-11-05', 'College', 'Internal'],
      ['Practical Marks Entry', '2024-11-06', '2024-11-08', 'Faculty', 'Internal'],
      ['Practical Marks Approval', '2024-11-09', '2024-11-10', 'HOD', 'Internal'],

      ['External Exam Registration', '2024-11-11', '2024-11-13', 'University Admin', 'External'],
      ['Internal Marks Lock & Submission', '2024-11-14', '2024-11-15', 'College Admin', 'Internal'],
      ['Student Enroll for External Exam', '2024-11-16', '2024-11-20', 'Student Login', 'External'],
      
      ['Question Paper Upload', '2024-11-21', '2024-11-23', 'Paper Setters', 'External'],
      ['Question Paper Finalization', '2024-11-24', '2024-11-25', 'Secrecy Department', 'External'],
      ['Seat Allocation & Mapping', '2024-11-26', '2024-11-28', 'College Admin', 'External'],
      ['Seating Arrangement Lock', '2024-11-29', '2024-11-30', 'College Admin', 'External'],
      
      ['Hall Ticket Release', '2024-12-01', '2024-12-01', 'University', 'External'],
      
      ['External Faculty Assignment', '2024-12-02', '2024-12-05', 'University Admin', 'External'],
      ['Last Working Day', '2024-12-05', '2024-12-05', 'College', 'General'],
      
      ['External (End Semester) Exams', '2024-12-10', '2024-12-25', 'University', 'External'],
      ['Valuation of Answer Scripts', '2024-12-26', '2025-01-10', 'University', 'External'],
      ['Results Declaration', '2025-01-20', '2025-01-20', 'University', 'External']
    ];

    for (const m of milestones) {
      await client.query(
        "INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type) VALUES ($1, $2, $3, $4, $5)",
        m
      );
    }

    await client.query("COMMIT");
    console.log("🎉 Phased Roadmap finalized successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Reset failed:", err.message);
  } finally {
    client.release();
    process.exit();
  }
};

resetMilestones();
