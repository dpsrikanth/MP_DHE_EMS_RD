const pool = require('../db');

// ----- Secrecy Department Dashboard Endpoints -----

exports.getDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(DISTINCT paper_setter_id) FROM paper_assignments) as total_paper_setters,
        (SELECT COUNT(*) FROM paper_assignments) as total_question_sets,
        (SELECT COUNT(*) FROM paper_assignments WHERE status = 'Finalized') as approved_papers,
        (SELECT COUNT(*) FROM paper_assignments WHERE status = 'Uploaded') as pending_review
    `;
    const { rows } = await pool.query(statsQuery);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const activityQuery = `
      (SELECT 'PAPER_UPLOADED' as type, qp.title as detail, u.name as user_name, qp.uploaded_at as activity_date
       FROM question_papers qp
       JOIN users u ON qp.setter_id = u.id)
      UNION ALL
      (SELECT 'PAPER_APPROVED' as type, ms.name || ' - Set ' || pa.set_name as detail, 'Secrecy' as user_name, pa.updated_at as activity_date
       FROM paper_assignments pa
       JOIN master_subjects ms ON pa.subject_id = ms.id
       WHERE pa.status = 'Finalized')
      UNION ALL
      (SELECT 'PAYMENT_PROCESSED' as type, u.name as detail, 'Secrecy' as user_name, psp.processed_at as activity_date
       FROM paper_setter_payments psp
       JOIN users u ON psp.paper_setter_id = u.id
       WHERE psp.status = 'Paid')
      ORDER BY activity_date DESC
      LIMIT 10
    `;
    const { rows } = await pool.query(activityQuery);
    res.json(rows);
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getPaperSetters = async (req, res) => {
  try {
    const settersQuery = `
      SELECT DISTINCT u.id, u.name, u.email, u.phone, r.role_name, 
             t.department, t.designation, t.experience, t.qualification, t.status as teacher_status,
             md.id as department_id, mdes.id as designation_id,
             COALESCE(ARRAY_AGG(DISTINCT ms.name) FILTER (WHERE ms.name IS NOT NULL), ARRAY[]::TEXT[]) as subjects,
             COALESCE(ARRAY_AGG(DISTINCT ms.id) FILTER (WHERE ms.id IS NOT NULL), ARRAY[]::INTEGER[]) as subject_ids
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN master_departments md ON t.department = md.department_name
      LEFT JOIN master_designations mdes ON t.designation = mdes.designation_name
      LEFT JOIN paper_setter_subjects pss ON u.id = pss.user_id
      LEFT JOIN master_subjects ms ON pss.subject_id = ms.id
      WHERE r.role_name IN ('Faculty', 'Teacher', 'External Faculty', 'PAPER_SETTER')
      GROUP BY u.id, u.name, u.email, u.phone, r.role_name, t.department, t.designation, t.experience, t.qualification, t.status, md.id, mdes.id
      ORDER BY u.name
    `;
    const { rows } = await pool.query(settersQuery);
    res.json(rows);
  } catch (error) {
    console.error('Error in getPaperSetters:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.addPaperSetter = async (req, res) => {
  try {
    const { user_id, subject_id, exam_id, set_name } = req.body;
    
    const query = `
      INSERT INTO paper_assignments (subject_id, exam_id, set_name, paper_setter_id, status)
      VALUES ($1, $2, $3, $4, 'Pending')
      ON CONFLICT (subject_id, exam_id, set_name)
      DO UPDATE SET paper_setter_id = EXCLUDED.paper_setter_id, status = 'Pending'
      RETURNING *;
    `;
    const result = await pool.query(query, [subject_id, exam_id, set_name, user_id]);
    res.json({ message: 'Paper setter assigned successfully', assignment: result.rows[0] });
  } catch (error) {
    console.error('Error in addPaperSetter:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.createNewSetter = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, phone, department, designation, experience, qualification, subjects } = req.body;

    // 1. Get PAPER_SETTER role ID
    const roleRes = await client.query("SELECT id FROM roles WHERE role_name = 'PAPER_SETTER'");
    if (roleRes.rows.length === 0) throw new Error('PAPER_SETTER role not found');
    const roleId = roleRes.rows[0].id;

    // 2. Create User
    const userQuery = `
      INSERT INTO users (name, email, phone, password, role_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone
      RETURNING id
    `;
    // Using simple password for now, in real app would use bcrypt and random gen
    const userResult = await client.query(userQuery, [name, email, phone, 'password123', roleId]);
    const userId = userResult.rows[0].id;

    // 3. Get Dept and Designation names
    const deptRes = await client.query("SELECT department_name FROM master_departments WHERE id = $1", [department]);
    const deptName = deptRes.rows[0]?.department_name || department;

    const desgRes = await client.query("SELECT designation_name FROM master_designations WHERE id = $1", [designation]);
    const desgName = desgRes.rows[0]?.designation_name || designation;

    // 4. Create/Update Teacher Profile
    const teacherQuery = `
      INSERT INTO teachers (user_id, designation, department, experience, qualification, status)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (user_id) DO UPDATE SET 
        designation = EXCLUDED.designation,
        department = EXCLUDED.department,
        experience = EXCLUDED.experience,
        qualification = EXCLUDED.qualification
    `;
    await client.query(teacherQuery, [userId, desgName, deptName, experience || 0, qualification || '']);

    // 5. Save Subjects
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      for (const sid of subjects) {
        if (sid) {
          await client.query("INSERT INTO paper_setter_subjects (user_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, sid]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'New paper setter created successfully', user_id: userId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in createNewSetter:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  } finally {
    client.release();
  }
};

exports.updatePaperSetter = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { name, email, phone, department, designation, experience, qualification, status, subjects } = req.body;
    console.log('Update Setter Request:', { id, subjects });

    // Update Users
    await client.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4",
      [name, email, phone, id]
    );

    // Get Dept and Designation names if they are IDs
    let deptName = department;
    if (!isNaN(department)) {
      const deptRes = await client.query("SELECT department_name FROM master_departments WHERE id = $1", [department]);
      deptName = deptRes.rows[0]?.department_name || department;
    }

    let desgName = designation;
    if (!isNaN(designation)) {
      const desgRes = await client.query("SELECT designation_name FROM master_designations WHERE id = $1", [designation]);
      desgName = desgRes.rows[0]?.designation_name || designation;
    }

    // Update Teachers
    await client.query(`
      INSERT INTO teachers (user_id, designation, department, experience, qualification, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET 
        designation = EXCLUDED.designation,
        department = EXCLUDED.department,
        experience = EXCLUDED.experience,
        qualification = EXCLUDED.qualification,
        status = EXCLUDED.status
    `, [id, desgName, deptName, experience || 0, qualification || '', status === 'Active']);

    // 4. Update Subjects
    if (subjects && Array.isArray(subjects)) {
      await client.query("DELETE FROM paper_setter_subjects WHERE user_id = $1", [id]);
      for (const sid of subjects) {
        if (sid) {
          await client.query("INSERT INTO paper_setter_subjects (user_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, sid]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Paper setter updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updatePaperSetter:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

exports.getQuestionPapers = async (req, res) => {
  try {
    const query = `
      SELECT pa.id as assignment_id, pa.subject_id, ms.name as subject_name, pa.exam_id, pa.set_name, pa.status,
             pa.feedback, qp.id as paper_id, qp.title, u.name as setter_name, pa.updated_at,
             e.name as exam_name, e.exam_date, sem.semester_name as semester
      FROM paper_assignments pa
      LEFT JOIN question_papers qp ON qp.assignment_id = pa.id
      LEFT JOIN users u ON pa.paper_setter_id = u.id
      LEFT JOIN master_subjects ms ON pa.subject_id = ms.id
      LEFT JOIN exams e ON pa.exam_id = e.id
      LEFT JOIN master_semesters sem ON e.semester_id = sem.id
      ORDER BY pa.updated_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error in getQuestionPapers:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updatePaperStatus = async (req, res) => {
  try {
    const { assignment_id, status, feedback } = req.body;
    
    const query = `
      UPDATE paper_assignments 
      SET status = $2, feedback = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [assignment_id, status, feedback]);
    
    if (status === 'Finalized') {
      // Auto-create payment entry if finalized
      await pool.query(`
        INSERT INTO paper_setter_payments (assignment_id, paper_setter_id, amount, status)
        SELECT id, assigned_faculty_id, 5000, 'Pending' -- Default amount 5000
        FROM paper_assignments WHERE id = $1
        ON CONFLICT DO NOTHING
      `, [assignment_id]);
    }
    
    res.json({ message: `Paper status updated to ${status}`, assignment: rows[0] });
  } catch (error) {
    console.error('Error in updatePaperStatus:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const query = `
      SELECT psp.id, u.name as setter_name, ms.name as subject_name, psp.amount, psp.status, psp.processed_at, psp.created_at
      FROM paper_setter_payments psp
      JOIN paper_assignments pa ON psp.assignment_id = pa.id
      JOIN users u ON psp.paper_setter_id = u.id
      JOIN master_subjects ms ON pa.subject_id = ms.id
      ORDER BY psp.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error in getPayments:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { payment_id, status } = req.body;
    const query = `
      UPDATE paper_setter_payments 
      SET status = $2, processed_at = CASE WHEN $2 = 'Paid' THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = $1 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [payment_id, status]);
    res.json({ message: `Payment status updated to ${status}`, payment: rows[0] });
  } catch (error) {
    console.error('Error in processPayment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
