const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/papers');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.PAPER_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

// ----- HOD Endpoints -----
exports.assignSet = async (req, res) => {
  try {
    const { subject_id, exam_id, set_name, assigned_faculty_id, assigned_chief_id } = req.body;
    const hod_id = req.user.id;

    // Insert or update assignment
    const query = `
      INSERT INTO paper_assignments (subject_id, exam_id, set_name, assigned_faculty_id, assigned_by_hod_id, status, assigned_chief_id)
      VALUES ($1, $2, $3, $4, $5, 'Pending', $6)
      ON CONFLICT (subject_id, exam_id, set_name) 
      DO UPDATE SET assigned_faculty_id = EXCLUDED.assigned_faculty_id,
                    assigned_by_hod_id = EXCLUDED.assigned_by_hod_id,
                    assigned_chief_id = EXCLUDED.assigned_chief_id,
                    status = 'Pending'
      RETURNING *;
    `;
    const result = await pool.query(query, [subject_id, exam_id, set_name, assigned_faculty_id, hod_id, assigned_chief_id || null]);
    res.json({ message: 'Faculty successfully assigned to set', assignment: result.rows[0] });
  } catch (error) {
    console.error('Error in assignSet:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAssignmentsByHOD = async (req, res) => {
  try {
    const hod_id = req.user.id;
    const query = `
      SELECT pa.id, pa.subject_id, ms.name as subject_name, mp.name as program_name, pa.exam_id, pa.set_name, pa.assigned_faculty_id, 
             pa.status, u.name as faculty_name, pa.created_at as assign_date, c.name as chief_name
      FROM paper_assignments pa
      LEFT JOIN users u ON pa.assigned_faculty_id = u.id
      LEFT JOIN users c ON pa.assigned_chief_id = c.id
      LEFT JOIN master_subjects ms ON pa.subject_id = ms.id
      LEFT JOIN master_programs mp ON ms.program_id = mp.id
      WHERE pa.assigned_by_hod_id = $1
      ORDER BY pa.created_at DESC
    `;
    const { rows } = await pool.query(query, [hod_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getHODFormData = async (req, res) => {
  try {
    const userRole = req.user?.roleName || req.user?.role || '';
    const userId = req.user.id;
    let departmentId = null;

    if (userRole === 'HOD') {
      const deptRes = await pool.query('SELECT id FROM master_departments WHERE hod_id = $1', [userId]);
      if (deptRes.rows.length > 0) {
        departmentId = deptRes.rows[0].id;
      } else {
        const teacherRes = await pool.query('SELECT department_id FROM master_teachers WHERE user_id = $1', [userId]);
        if (teacherRes.rows.length > 0) departmentId = teacherRes.rows[0].department_id;
      }
    }

    // Default queries (All)
    let subjectsQuery = 'SELECT id, subject_code, name, program_id FROM master_subjects ORDER BY name';
    let facultiesQuery = `
      SELECT u.id, u.name, u.email, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name ILIKE '%faculty%' OR r.role_name ILIKE '%teacher%' OR r.role_name ILIKE 'HOD'
      ORDER BY u.name
    `;
    let programsQuery = 'SELECT id, name, code FROM master_programs ORDER BY name';
    let chiefsQuery = `
      SELECT u.id, u.name, u.email, r.role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name IN ('admin', 'SUPER_ADMIN', 'college_admin', 'HOD')
      ORDER BY u.name
    `;
    let queryParams = [];
    let chiefParams = [];

    // Filtered by department if available
    if (departmentId) {
      // 1. Programs by Dept
      const programsRes = await pool.query(`
        SELECT DISTINCT p.id, p.name, p.code 
        FROM master_programs p
        JOIN master_program_departments mpd ON p.id = mpd.program_id
        WHERE mpd.department_id = $1
        ORDER BY p.name
      `, [departmentId]);
      
      // 2. Subjects by Dept
      const subjectsRes = await pool.query(`
        SELECT DISTINCT s.id, s.subject_code, s.name, s.program_id
        FROM master_subjects s
        JOIN master_subject_departments msd ON s.id = msd.subject_id
        WHERE msd.department_id = $1
        ORDER BY s.name
      `, [departmentId]);

      // 3. Faculty by Dept, and their associated programs
      // We get all faculties in the department, but also join with their programs to allow frontend filtering
      const facultiesRes = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.email, r.role_name, 
               ARRAY_AGG(DISTINCT ms.program_id) FILTER (WHERE ms.program_id IS NOT NULL) as program_ids
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN master_teachers mt ON u.id = mt.user_id
        LEFT JOIN master_subjects ms ON (u.id = ms.teacher_id)
        WHERE mt.department_id = $1
        GROUP BY u.id, u.name, u.email, r.role_name
        ORDER BY u.name
      `, [departmentId]);

      // Only apply filtering if it actually returns data
      const finalPrograms = (programsRes.rows.length > 0) ? programsRes.rows : (await pool.query(programsQuery)).rows;
      const finalSubjects = (subjectsRes.rows.length > 0) ? subjectsRes.rows : (await pool.query(subjectsQuery)).rows;
      const finalFaculties = (facultiesRes.rows.length > 0) ? facultiesRes.rows : (await pool.query(facultiesQuery)).rows;

      // ... existing chiefs logic ...

      // Chiefs for HOD
      let finalChiefs = [];
      if (userRole === 'HOD') {
        const hChiefs = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        finalChiefs = hChiefs.rows;
      } else {
        finalChiefs = (await pool.query(chiefsQuery)).rows;
      }

      return res.json({ 
        subjects: finalSubjects, 
        faculties: finalFaculties, 
        programs: finalPrograms, 
        chiefs: finalChiefs,
        debug: { departmentId, userId, filtered: true }
      });
    }

    // Default return for non-HOD or no department
    const [s, f, p, c] = await Promise.all([
      pool.query(subjectsQuery),
      pool.query(facultiesQuery),
      pool.query(programsQuery),
      pool.query(chiefsQuery)
    ]);

    res.json({ 
      subjects: s.rows, 
      faculties: f.rows, 
      programs: p.rows, 
      chiefs: c.rows,
      debug: { userId, filtered: false }
    });

  } catch (err) {
    console.error('Error in getHODFormData:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// ----- Faculty Endpoints -----
exports.getFacultyAssignments = async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const query = `
      SELECT pa.id as assignment_id, pa.subject_id, ms.name as subject_name, pa.exam_id, pa.set_name, pa.status,
             qp.id as paper_id, qp.title as uploaded_title
      FROM paper_assignments pa
      LEFT JOIN question_papers qp ON qp.assignment_id = pa.id
      LEFT JOIN master_subjects ms ON pa.subject_id = ms.id
      WHERE pa.assigned_faculty_id = $1
    `;
    const { rows } = await pool.query(query, [faculty_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.checkIfAssigned = async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { rows } = await pool.query('SELECT id FROM paper_assignments WHERE assigned_faculty_id = $1 LIMIT 1', [faculty_id]);
    res.json({ isAssigned: rows.length > 0 });
  } catch (error) {
    res.json({ isAssigned: false });
  }
};

exports.uploadPaper = async (req, res) => {
  try {
    const { assignment_id, title } = req.body;
    const file = req.file;
    const setter_id = req.user.id;

    if (!file) return res.status(400).json({ message: 'No file uploaded.' });

    // Validate assignment ownership
    const checkQuery = await pool.query('SELECT * FROM paper_assignments WHERE id = $1 AND assigned_faculty_id = $2', [assignment_id, setter_id]);
    if (checkQuery.rows.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ message: 'Unauthorized assignment ID.' });
    }

    // Encrypt
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    
    const ext = path.extname(file.originalname);
    const encryptedFileName = `paper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}.enc`;
    const encryptedFilePath = path.join(uploadsDir, encryptedFileName);

    const input = fs.createReadStream(file.path);
    const output = fs.createWriteStream(encryptedFilePath);
    
    input.pipe(cipher).pipe(output);

    output.on('finish', async () => {
      fs.unlinkSync(file.path); // remove raw file
      
      const insertQ = `
        INSERT INTO question_papers (assignment_id, title, setter_id, file_path, iv)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `;
      await pool.query(insertQ, [assignment_id, title, setter_id, encryptedFileName, iv.toString('hex')]);
      
      await pool.query("UPDATE paper_assignments SET status = 'Uploaded' WHERE id = $1", [assignment_id]);
      
      res.status(201).json({ message: 'Paper securely encrypted and uploaded.' });
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ----- Chief Examiner Endpoints -----
exports.getReviewDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user?.roleName || req.user?.role;
    
    // HOD only sees what's assigned to them. Admin sees everything assigned to them OR unassigned.
    let query = `
      SELECT pa.id as assignment_id, pa.subject_id, ms.name as subject_name, pa.exam_id, pa.set_name, pa.status,
             qp.id as paper_id, qp.title, u.name as setter_name
      FROM paper_assignments pa
      LEFT JOIN question_papers qp ON qp.assignment_id = pa.id
      LEFT JOIN users u ON qp.setter_id = u.id
      LEFT JOIN master_subjects ms ON pa.subject_id = ms.id
      WHERE pa.status IN ('Uploaded', 'Finalized')
    `;

    if (userRole === 'HOD') {
      query += ` AND pa.assigned_chief_id = $1`;
    } else {
      query += ` AND (pa.assigned_chief_id = $1 OR pa.assigned_chief_id IS NULL)`;
    }

    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.downloadPaper = async (req, res) => {
  try {
    const { paper_id } = req.params;
    const userRole = req.user?.roleName || req.user?.role;
    const userId = req.user.id;

    // Auth check: either Chief Examiner (Admin/HOD) or the Faculty who uploaded it
    const { rows } = await pool.query(`
      SELECT qp.*, pa.status as assignment_status, pa.assigned_chief_id
      FROM question_papers qp
      JOIN paper_assignments pa ON qp.assignment_id = pa.id
      WHERE qp.id = $1
    `, [paper_id]);

    if(rows.length === 0) return res.status(404).json({ message: 'Paper not found.' });

    const paper = rows[0];
    const isOwner = paper.setter_id === userId;
    const isChief = ['admin', 'SUPER_ADMIN', 'college_admin', 'HOD'].includes(userRole) && 
                    (userRole === 'HOD' ? (paper.assigned_chief_id === userId) : true);

    if (!isOwner && !isChief) {
      return res.status(403).json({ message: 'Forbidden. Unauthorized to access this paper.' });
    }

    const encryptedFilePath = path.join(uploadsDir, paper.file_path);
    if (!fs.existsSync(encryptedFilePath)) return res.status(404).json({ message: 'File missing from server.' });

    const iv = Buffer.from(paper.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY), iv);
    const input = fs.createReadStream(encryptedFilePath);
    
    const rawFileName = paper.file_path.replace('.enc', '');
    res.setHeader('Content-Disposition', 'attachment; filename="' + rawFileName + '"');
    res.setHeader('Content-Type', 'application/octet-stream');
    
    input.pipe(decipher).pipe(res);
  } catch (error) {
    console.error('Error downloading:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.finalizePaper = async (req, res) => {
  try {
    const { assignment_id } = req.body;
    
    // 1. Role Check
    const userRole = req.user?.roleName || req.user?.role;
    if(!['admin', 'SUPER_ADMIN', 'college_admin', 'HOD'].includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient Privileges' });
    }

    // 2. Ownership Assignment Check
    const chief_id = req.user.id;
    const { rows } = await pool.query('SELECT assigned_chief_id FROM paper_assignments WHERE id = $1', [assignment_id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    
    if (rows[0].assigned_chief_id && rows[0].assigned_chief_id !== chief_id) {
       // Admins might be allowed to override, but HODs strictly only their own
       if (userRole === 'HOD') return res.status(403).json({ message: 'Forbidden: You are not the assigned reviewer.' });
    }

    await pool.query("UPDATE paper_assignments SET status = 'Finalized' WHERE id = $1", [assignment_id]);
    res.json({ message: 'Paper set was successfully approved & finalized.' });
  } catch (error) {
    console.error('Error finalizing:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
