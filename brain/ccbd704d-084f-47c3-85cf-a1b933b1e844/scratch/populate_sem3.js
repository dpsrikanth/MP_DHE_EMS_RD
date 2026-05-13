const pool = require('../../../Server/config/db');

async function run() {
  try {
    console.log('Starting data population...');
    
    // Cleanup existing data if any (to avoid duplicates on retry)
    await pool.query("DELETE FROM academic_milestones WHERE semester_id = 17 AND academic_year_id = 2 AND program_id = 2");
    await pool.query("DELETE FROM master_subject_mappings WHERE semester_id = 17 AND program_id = 2");
    await pool.query("DELETE FROM master_subjects WHERE subject_code IN ('CN301', 'OS302')");

    // 1. Create subjects
    const s1 = await pool.query(
      'INSERT INTO master_subjects (subject_code, name, status, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, credit, university_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      ['CN301', 'Computer Networks', 'Active', 2, 17, 'Major 2', 'M', true, 4, 4, 7]
    );
    const s2 = await pool.query(
      'INSERT INTO master_subjects (subject_code, name, status, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, credit, university_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      ['OS302', 'Operating Systems', 'Active', 2, 17, 'Major 3', 'M', true, 4, 4, 7]
    );
    
    console.log('Subjects created.');
    
    const ids = [16, s1.rows[0].id, s2.rows[0].id];
    
    // 2. Map subjects
    for (const sid of ids) {
      await pool.query(
        'INSERT INTO master_subject_mappings (program_id, semester_id, subject_id, is_mandatory, has_examination, periods_per_week, mapping_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
        [2, 17, sid, 'M', true, sid === 16 ? 6 : 4, sid === 16 ? 'Major 1' : (sid === ids[1] ? 'Major 2' : 'Major 3'), 'Active']
      );
    }
    
    console.log('Subject mappings created.');
    
    // 3. Create milestones
    const milestones = [
      ['Commencement of Classes', '2025-08-01', '2025-08-01', 'College Admin', 'Internal'],
      ['Internal Exam 1 (Mid-1)', '2025-09-10', '2025-09-15', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-1)', '2025-09-16', '2025-09-20', 'Faculty', 'Internal'],
      ['Internal Exam 2 (Mid-2)', '2025-10-15', '2025-10-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-2)', '2025-10-21', '2025-10-25', 'Faculty', 'Internal'],
      ['Internal Exam 3 (Mid-3)', '2025-11-15', '2025-11-20', 'College', 'Internal'],
      ['Internal Marks Entry (Mid-3)', '2025-11-21', '2025-11-25', 'Faculty', 'Internal'],
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
    
    console.log('Successfully populated subjects, mappings, and milestones for Semester 3');
  } catch (e) {
    console.error('Error during population:', e);
  } finally {
    process.exit();
  }
}

run();
