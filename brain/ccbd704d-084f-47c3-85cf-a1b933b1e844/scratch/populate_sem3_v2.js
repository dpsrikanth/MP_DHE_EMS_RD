const pool = require('../../../Server/config/db');

async function run() {
  try {
    console.log('Starting data population with schedule details...');
    
    // Cleanup existing data for Sem 3
    await pool.query("DELETE FROM academic_milestones WHERE semester_id = 17 AND academic_year_id = 2 AND program_id = 2");
    
    // We assume subjects and mappings are already done, but we'll re-run them just in case (ON CONFLICT will handle it)
    // No need to delete subjects/mappings as they are stable.

    // Create milestones with Schedule Details
    const milestones = [
      ['Commencement of Classes', '2025-08-01', '2025-08-01', 'College Admin', 'Internal'],
      
      ['INTERNAL EXAM 1 SCHEDULE DETAILS (MID-1)', '2025-09-01', '2025-09-05', 'COLLEGE', 'Internal'],
      ['Internal Exam 1 (Mid-1)', '2025-09-10', '2025-09-15', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-1)', '2025-09-16', '2025-09-20', 'Faculty', 'Internal'],
      
      ['INTERNAL EXAM 2 SCHEDULE DETAILS (MID-2)', '2025-10-01', '2025-10-05', 'COLLEGE', 'Internal'],
      ['Internal Exam 2 (Mid-2)', '2025-10-15', '2025-10-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-2)', '2025-10-21', '2025-10-25', 'Faculty', 'Internal'],
      
      ['INTERNAL EXAM 3 SCHEDULE DETAILS (MID-3)', '2025-11-01', '2025-11-05', 'COLLEGE', 'Internal'],
      ['Internal Exam 3 (Mid-3)', '2025-11-15', '2025-11-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-3)', '2025-11-21', '2025-11-25', 'Faculty', 'Internal'],
      
      ['PRACTICAL EXAM SCHEDULE DETAILS', '2025-11-26', '2025-11-28', 'COLLEGE', 'Internal'],
      ['Practical Exam', '2025-12-01', '2025-12-05', 'College', 'Internal'],
      ['Practical Marks Entry', '2025-12-06', '2025-12-10', 'Faculty', 'Internal'],
      ['Practical Marks Approval', '2025-12-11', '2025-12-12', 'HOD', 'Internal'],
      
      ['External Exam Registration', '2025-12-13', '2025-12-20', 'University Admin', 'Internal'],
      ['Internal Marks Lock & Submission', '2025-12-21', '2025-12-22', 'College Admin', 'Internal'],
      ['Student Enroll for External Exam', '2025-12-23', '2025-12-27', 'Student Login', 'Internal'],
      ['Seat Allocation & Mapping', '2026-01-02', '2026-01-04', 'College Admin', 'Internal'],
      ['Hall Ticket Release', '2026-01-05', '2026-01-05', 'University', 'Internal'],
      ['External (End Semester) Exams', '2026-01-10', '2026-01-25', 'University', 'Internal'],
      ['Results Declaration', '2026-02-15', '2026-02-15', 'University', 'Internal']
    ];
    
    for (const m of milestones) {
      await pool.query(
        'INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, semester_id, academic_year_id, program_id, delete_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)',
        [m[0], m[1], m[2], m[3], m[4], 17, 2, 2]
      );
    }
    
    console.log('Successfully populated milestones with schedule details for Semester 3');
  } catch (e) {
    console.error('Error during population:', e);
  } finally {
    process.exit();
  }
}

run();
