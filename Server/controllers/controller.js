require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const client = require("../db");
const jwt = require("jsonwebtoken");

// Register endpoint
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email exists
    const existingUser = await client.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get role_id from roles table
    const roleResult = await client.query(
      "SELECT id FROM public.roles WHERE role_name = $1",
      [role],
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ message: `Invalid role: ${role}. Available roles: superAdmin, admin, student` });
    }

    const roleId = roleResult.rows[0].id;

    // Insert user
    const result = await client.query(
      "INSERT INTO public.users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id",
      [name, email, hashedPassword, roleId],
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Dashboard endpoints - Get statistics and data
const getDashboardStats = async (req, res) => {
  try {
    const statsQueries = {
      totalUsers: "SELECT COUNT(*) FROM users",
      activeExams: "SELECT COUNT(*) FROM exams",
      totalPrograms: "SELECT COUNT(*) FROM master_programs",
      totalSemesters: "SELECT COUNT(*) FROM master_semesters",
      totalSubjects: "SELECT COUNT(*) FROM master_subjects",
      totalAcademicYears: "SELECT COUNT(*) FROM master_academic_years",
      totalPolicies: "SELECT COUNT(*) FROM master_policies",
    };

    const stats = {};
    for (const [key, query] of Object.entries(statsQueries)) {
      const result = await client.query(query);
      stats[key] = parseInt(result.rows[0].count, 10);
    }
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name, email, role_id, is_active, created_at FROM public.users LIMIT 10",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPrograms = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name, duration_years, university_id, status FROM programs"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name, program_id, semester_id, credits, status FROM subjects LIMIT 100"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, year_name, created_at, created_by, updated_at, updated_by FROM master_academic_years WHERE deleteflag = true ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createAcademicYear = async (req, res) => {
  try {
    const { year_name } = req.body;
    if (!year_name) return res.status(400).json({ message: 'Year name is required' });
    const result = await client.query(
      `INSERT INTO master_academic_years (year_name, created_at, deleteflag)
       VALUES ($1, CURRENT_TIMESTAMP, true)
       RETURNING id, year_name, created_at, created_by, updated_at, updated_by`,
      [year_name]
    );
    res.status(201).json({ message: 'Academic year created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAcademicYear = async (req, res) => {
  try {
    const id = req.params.id;
    const { year_name } = req.body;
    if (!year_name) return res.status(400).json({ message: 'Year name is required' });
    const checkResult = await client.query('SELECT id FROM master_academic_years WHERE id = $1 AND deleteflag = true', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Academic year not found' });
    const result = await client.query(
      `UPDATE master_academic_years SET year_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleteflag = true RETURNING id, year_name, created_at, created_by, updated_at, updated_by`,
      [year_name, id]
    );
    res.json({ message: 'Academic year updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteAcademicYear = async (req, res) => {
  try {
    const id = req.params.id;
    const checkResult = await client.query('SELECT id FROM master_academic_years WHERE id = $1 AND deleteflag = true', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Academic year not found' });
    await client.query('UPDATE master_academic_years SET deleteflag = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSemesters = async (req, res) => {
  try {
    const result = await client.query("SELECT id, semester_number, program_id, academic_year_id, start_date, end_date, status FROM semesters");
    res.json(result.rows);
  } catch (error) {
    console.error("Get semesters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getExamTypes = async (req, res) => {
  try {
    const result = await client.query("SELECT id, type_name FROM exam_types");
    res.json(result.rows);
  } catch (error) {
    console.error("Get exam types error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const result = await client.query("SELECT id, role_name FROM roles");
    res.json(result.rows);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await client.query(
      `SELECT u.id, u.name, u.email, u.password, r.role_name FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.email = $1`,
      [email]
    );
    if (user.rows.length === 0) return res.status(400).json({ message: "User not found" });
    const result = user.rows[0];
    const payload = { id: result.id, email: result.email, role: result.role_name };
    const accessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "30d" });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined 
    });
    res.json({ token: accessToken, user: { id: result.id, name: result.name, email: result.email, role: result.role_name } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;
    if (!refreshTokenCookie) return res.status(401).json({ message: "No refresh token provided" });
    jwt.verify(refreshTokenCookie, process.env.REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid refresh token" });
      const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
      const newAccessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "1m" });
      res.json({ token: newAccessToken });
    });
  } catch (err) {
    console.log("Refresh Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUniversities = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT u.id, u.name, u.address, u.status, u.created_at,
        (SELECT COUNT(*) FROM colleges WHERE university_id = u.id) as colleges_count,
        (SELECT COUNT(*) FROM programs WHERE university_id = u.id) as programs_count,
        (SELECT COUNT(*) FROM academic_years WHERE university_id = u.id) as academic_years_count
       FROM universities u ORDER BY u.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get universities error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUniversity = async (req, res) => {
  try {
    const { name, address, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    await client.query('BEGIN');
    const universityResult = await client.query(
      'INSERT INTO universities (name, address, status) VALUES ($1, $2, $3) RETURNING id, name, address, status, created_at',
      [name, address || null, status === undefined ? true : status]
    );
    const newUniversity = universityResult.rows[0];
    await client.query(
      'INSERT INTO colleges (name, university_id, address, status) VALUES ($1, $2, $3, $4)',
      [name, newUniversity.id, address || null, status === undefined ? true : status]
    );
    await client.query('COMMIT');
    res.status(201).json(newUniversity);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create university error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUniversity = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, address, status } = req.body;
    const result = await client.query(
      'UPDATE universities SET name=$1, address=$2, status=$3 WHERE id=$4 RETURNING id, name, address, status, created_at',
      [name, address || null, status === undefined ? true : status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'University not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update university error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteUniversity = async (req, res) => {
  try {
    const id = req.params.id;
    await client.query('DELETE FROM universities WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete university error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createCollege = async (req, res) => {
  try {
    const { name, college_code, university_id, address, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await client.query(
      'INSERT INTO colleges (name, college_code, university_id, address, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, college_code || null, university_id, address || null, status === undefined ? true : status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create college error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { name, college_code, address, status } = req.body;
    const id = req.params.id;
    const result = await client.query(
      'UPDATE colleges SET name=$1, college_code=$2, address=$3, status=$4 WHERE id=$5 RETURNING *',
      [name, college_code || null, address || null, status === undefined ? true : status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'College not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update college error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteCollege = async (req, res) => {
  try {
    const id = req.params.id;
    await client.query('DELETE FROM colleges WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete college error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createProgram = async (req, res) => {
  try {
    const { name, duration_years, university_id, status } = req.body;
    if (!name || !duration_years) return res.status(400).json({ message: 'Name and duration are required' });
    const result = await client.query(
      'INSERT INTO programs (name, duration_years, university_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, duration_years, university_id, status === undefined ? true : status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create program error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateProgram = async (req, res) => {
  try {
    const { name, duration_years, status } = req.body;
    const id = req.params.id;
    const result = await client.query(
      'UPDATE programs SET name=$1, duration_years=$2, status=$3 WHERE id=$4 RETURNING *',
      [name, duration_years, status === undefined ? true : status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Program not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update program error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const id = req.params.id;
    await client.query('DELETE FROM programs WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete program error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM public.students ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, policies, programName, admission_year, semister } = req.body;
    if (!name) return res.status(400).json({ message: 'Student name is required' });
    const result = await client.query(
      `INSERT INTO students (name, policies, "programName", admission_year, semister, created_at, updated_at, "deleteStatus")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true) RETURNING *`,
      [name, policies || null, programName || null, admission_year || null, semister || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getColleges = async (req, res) => {
  try {
    const result = await client.query(`SELECT c.id, c.name AS college_name, c.college_code, c.university_id, u.name AS university_name, c.address, c.status, c.created_at FROM colleges c LEFT JOIN universities u ON c.university_id = u.id`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get colleges error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTeachers = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
    t.id,
    u.name AS teacher_name,
    u.email,
    c.name AS college_name,
    t.department,
    t.designation,
    t.experience,
    t.status
FROM teachers t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN colleges c ON t.college_id = c.id
ORDER BY t.id DESC;`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { college_id, designation, department, experience, status, name, email } = req.body;

  try {
    // 1️⃣ Check if teacher exists
    const teacherResult = await client.query(
      "SELECT * FROM teachers WHERE id = $1",
      [id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacher = teacherResult.rows[0];

    // 2️⃣ Start transaction
    await client.query("BEGIN");

    // 3️⃣ Update users table (if name or email provided)
    if (name || email) {
      await client.query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email)
         WHERE id = $3`,
        [name || null, email || null, teacher.user_id]
      );
    }

    // 4️⃣ Update teachers table
    await client.query(
      `UPDATE teachers
       SET college_id = COALESCE($1, college_id),
           designation = COALESCE($2, designation),
           department = COALESCE($3, department),
           experience = COALESCE($4, experience),
           status = COALESCE($5, status)
       WHERE id = $6`,
      [college_id ?? null, designation ?? null, department ?? null, experience ?? null, status ?? null, id]
    );

    // 5️⃣ Commit transaction
    await client.query("COMMIT");
    res.json({ message: "Teacher updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(400).json({ message: "Email already in use" });
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Create teacher record (used by frontend when adding new faculty)
const createTeacher = async (req, res) => {
  const { teacher_name, email, college_id, designation, department, experience, status } = req.body;

  if (!teacher_name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // begin transaction
    await client.query('BEGIN');
    // insert user
    const userResult = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
      [teacher_name, email]
    );
    const userId = userResult.rows[0].id;

    // insert teacher
    const teacherResult = await client.query(
      `INSERT INTO teachers (user_id, college_id, designation, department, experience, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, college_id || null, designation || null, department || null, experience || null, status || true]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Teacher created successfully', id: teacherResult.rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already in use' });
    }
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getExams = async (req, res) => {
  try {
    const result = await client.query("SELECT id, name as exam_name, semester_id, college_id, exam_type, exam_date, status FROM exams");
    res.json(result.rows);
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const result = await client.query(`SELECT m.id, m.student_id, u.name as student_name, m.subject_id, sub.name as subject_name, m.exam_id, m.marks_obtained, m.max_marks FROM marks m LEFT JOIN students s ON m.student_id = s.id LEFT JOIN users u ON s.user_id = u.id LEFT JOIN subjects sub ON m.subject_id = sub.id`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get marks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSemesters = async (req, res) => {
  try {
    const result = await client.query("SELECT id, semester_name, created_at FROM master_semesters ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Get master semesters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterSemester = async (req, res) => {
  try {
    const { semester_name } = req.body;
    if (!semester_name) return res.status(400).json({ message: "Semester name is required" });
    const result = await client.query("INSERT INTO master_semesters (semester_name) VALUES ($1) RETURNING id, semester_name, created_at", [semester_name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { semester_name } = req.body;
    if (!semester_name) return res.status(400).json({ message: "Semester name is required" });
    const result = await client.query("UPDATE master_semesters SET semester_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, semester_name, created_at", [semester_name, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master semester not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM master_semesters WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master semester not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, semester_name, created_at FROM master_semesters WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master semester not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSubjects = async (req, res) => {
  try {
    const result = await client.query("SELECT id, subject_code, name, created_at FROM master_subjects ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Get master subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterSubject = async (req, res) => {
  try {
    const { subject_code, name } = req.body;
    if (!subject_code || !name) return res.status(400).json({ message: "Subject code and name are required" });
    const result = await client.query("INSERT INTO master_subjects (subject_code, name) VALUES ($1, $2) RETURNING id, subject_code, name, created_at", [subject_code, name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, subject_code, name, created_at FROM master_subjects WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, name } = req.body;
    if (!subject_code || !name) return res.status(400).json({ message: "Subject code and name are required" });
    const result = await client.query("UPDATE master_subjects SET subject_code = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, subject_code, name, created_at", [subject_code, name, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM master_subjects WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterPrograms = async (req, res) => {
  try {
    const result = await client.query("SELECT id, name, duration_years, created_at FROM master_programs ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Get master programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterProgram = async (req, res) => {
  try {
    const { name, duration_years } = req.body;
    if (!name || !duration_years) return res.status(400).json({ message: "Program name and duration are required" });
    const result = await client.query("INSERT INTO master_programs (name, duration_years) VALUES ($1, $2) RETURNING id, name, duration_years, created_at", [name, duration_years]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, name, duration_years, created_at FROM master_programs WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master program not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration_years } = req.body;
    if (!name || !duration_years) return res.status(400).json({ message: "Program name and duration are required" });
    const result = await client.query("UPDATE master_programs SET name = $1, duration_years = $2 WHERE id = $3 RETURNING id, name, duration_years, created_at", [name, duration_years, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master program not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM master_programs WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master program not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterPolicies = async (req, res) => {
  try {
    const result = await client.query("SELECT id, name FROM master_policies ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Get master policies error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterPolicy = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Policy name is required" });
    const result = await client.query("INSERT INTO master_policies (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at", [name, description]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, name, description, created_at FROM master_policies WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master policy not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Policy name is required" });
    const result = await client.query(
      "UPDATE master_policies SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, description, created_at",
      [name, description, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Master policy not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM master_policies WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master policy not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Master Teachers Functions
const getMasterTeachers = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        mt.id,
        u.name,
        u.email,
        c.name AS college_name,
        md.department_name AS department,
        mdes.designation_name AS designation,
        mt.experience_years AS experience,
        mt.status
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      LEFT JOIN colleges c ON mt.college_id = c.id
      LEFT JOIN master_departments md ON mt.department_id = md.id
      LEFT JOIN master_designations mdes ON mt.designation_id = mdes.id
      WHERE mt.status = 'Active'
      ORDER BY mt.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master teachers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `SELECT 
        mt.id,
        u.name,
        u.email,
        mt.college_id,
        mt.department_id,
        mt.designation_id,
        mt.experience_years,
        mt.status,
        c.name AS college_name,
        md.department_name AS department,
        mdes.designation_name AS designation
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      LEFT JOIN colleges c ON mt.college_id = c.id
      LEFT JOIN master_departments md ON mt.department_id = md.id
      LEFT JOIN master_designations mdes ON mt.designation_id = mdes.id
      WHERE mt.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master teacher not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master teacher error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterTeacher = async (req, res) => {
  const { name, email, college_id, department_id, designation_id, employee_code, experience, status } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !college_id || !department_id || !designation_id) {
      return res.status(400).json({ success: false, message: "Name, email, college, department, and designation are required" });
    }

    // Check if email already exists
    const existingEmail = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Generate employee code if not provided
    const finalEmployeeCode = employee_code || `EMP-${Date.now()}`;

    // Check if employee code already exists
    const existingCode = await client.query(
      "SELECT id FROM master_teachers WHERE employee_code = $1",
      [finalEmployeeCode]
    );

    if (existingCode.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Employee code already exists" });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
      [name, email]
    );
    const userId = userResult.rows[0].id;

    // Create master teacher
    const result = await client.query(
      `INSERT INTO master_teachers (user_id, employee_code, college_id, department_id, designation_id, experience_years, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, employee_code, college_id, department_id, designation_id, experience_years, status`,
      [userId, finalEmployeeCode, college_id, department_id, designation_id, experience || 0, status || 'Active']
    );

    const teacherId = result.rows[0].id;

    // Fetch the complete record with all joins for display
    const completeRecord = await client.query(
      `SELECT 
        mt.id,
        u.name,
        u.email,
        c.name AS college_name,
        md.department_name AS department,
        mdes.designation_name AS designation,
        mt.experience_years AS experience,
        mt.status,
        mt.college_id,
        mt.department_id,
        mt.designation_id
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      LEFT JOIN colleges c ON mt.college_id = c.id
      LEFT JOIN master_departments md ON mt.department_id = md.id
      LEFT JOIN master_designations mdes ON mt.designation_id = mdes.id
      WHERE mt.id = $1`,
      [teacherId]
    );

    await client.query('COMMIT');
    res.status(201).json({ 
      success: true, 
      message: "Teacher record created successfully",
      data: completeRecord.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Create master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const updateMasterTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, college_id, department_id, designation_id, experience, status } = req.body;

  try {
    // Get existing teacher
    const existing = await client.query(
      "SELECT user_id FROM master_teachers WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Master teacher not found" });
    }

    const userId = existing.rows[0].user_id;

    // Begin transaction
    await client.query('BEGIN');

    // Update user if name or email provided
    if (name || email) {
      await client.query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3`,
        [name || null, email || null, userId]
      );
    }

    // Update master teacher
    await client.query(
      `UPDATE master_teachers 
       SET college_id = COALESCE($2, college_id),
           department_id = COALESCE($3, department_id),
           designation_id = COALESCE($4, designation_id),
           experience_years = COALESCE($5, experience_years),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, college_id || null, department_id || null, designation_id || null, experience || null, status || null]
    );

    // Fetch the complete updated record with all joins
    const result = await client.query(
      `SELECT 
        mt.id,
        u.name,
        u.email,
        c.name AS college_name,
        md.department_name AS department,
        mdes.designation_name AS designation,
        mt.experience_years AS experience,
        mt.status,
        mt.college_id,
        mt.department_id,
        mt.designation_id
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      LEFT JOIN colleges c ON mt.college_id = c.id
      LEFT JOIN master_departments md ON mt.department_id = md.id
      LEFT JOIN master_designations mdes ON mt.designation_id = mdes.id
      WHERE mt.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: "Teacher record updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Update master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteMasterTeacher = async (req, res) => {
  const { id } = req.params;

  try {
    // Soft delete: Update status to 'Inactive' instead of deleting the record
    const result = await client.query(
      `UPDATE master_teachers 
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Master teacher not found" });
    }

    res.json({ 
      success: true, 
      message: "Teacher record deleted successfully",
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error("Delete master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Master Designation Functions
const getMasterDesignations = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, designation_name, status
       FROM master_designations
       WHERE status = 'Active'
       ORDER BY designation_name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master designations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterDesignation = async (req, res) => {
  const { designation_name, status } = req.body;

  try {
    if (!designation_name) {
      return res.status(400).json({ message: "Designation name is required" });
    }

    const result = await client.query(
      `INSERT INTO master_designations (designation_name, status)
       VALUES ($1, $2)
       RETURNING id, designation_name, status`,
      [designation_name, status || 'Active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master designation error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ message: "Designation already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Master Department Functions
const getMasterDepartments = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, department_name, department_code, college_id, status
       FROM master_departments
       WHERE status = 'Active'
       ORDER BY department_name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master departments error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterDepartment = async (req, res) => {
  const { department_name, department_code, college_id, status } = req.body;

  try {
    if (!department_name || !college_id) {
      return res.status(400).json({ message: "Department name and college are required" });
    }

    // Generate department code if not provided
    const finalDeptCode = department_code || `DEPT-${Date.now().toString().slice(-8)}`;

    const result = await client.query(
      `INSERT INTO master_departments (department_name, department_code, college_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, department_name, department_code, college_id, status`,
      [department_name, finalDeptCode, college_id, status || 'Active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master department error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ message: "Department code or name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  getDashboardStats,
  getUsers,
  getPrograms,
  getSubjects,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getSemesters,
  getExamTypes,
  getRoles,
  Login,
  refreshToken,
  getUniversities,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  createCollege,
  updateCollege,
  deleteCollege,
  createProgram,
  updateProgram,
  deleteProgram,
  getStudents,
  createStudent,
  getColleges,
  getTeachers,
  updateTeacher,
  getExams,
  getMarks,
  getMasterSemesters,
  createMasterSemester,
  updateMasterSemester,
  deleteMasterSemester,
  getMasterSemester,
  getMasterSubjects,
  createMasterSubject,
  getMasterSubject,
  updateMasterSubject,
  deleteMasterSubject,
  getMasterPrograms,
  createMasterProgram,
  getMasterProgram,
  updateMasterProgram,
  deleteMasterProgram,
  getMasterPolicies,
  createMasterPolicy,
  getMasterPolicy,
  updateMasterPolicy,
  deleteMasterPolicy,
 // master teachers
  getMasterTeachers,
  getMasterTeacher,
  createMasterTeacher,
  updateMasterTeacher,
  deleteMasterTeacher,
  // master designations
  getMasterDesignations,
  createMasterDesignation,
  // master departments
  getMasterDepartments,
  createMasterDepartment
};