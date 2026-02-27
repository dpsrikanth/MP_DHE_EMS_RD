
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const client = require("../db");
const jwt=require("jsonwebtoken")

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
      totalPrograms: "SELECT COUNT(*) FROM programs",
      totalSemesters: "SELECT COUNT(*) FROM semesters",
      totalSubjects: "SELECT COUNT(*) FROM subjects",
      totalAcademicYears: "SELECT COUNT(*) FROM academic_years",
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
    
    if (!year_name) {
      return res.status(400).json({ message: 'Year name is required' });
    }

    const result = await client.query(
      `INSERT INTO master_academic_years (year_name, created_at, deleteflag)
       VALUES ($1, CURRENT_TIMESTAMP, true)
       RETURNING id, year_name, created_at, created_by, updated_at, updated_by`,
      [year_name]
    );

    res.status(201).json({
      message: 'Academic year created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAcademicYear = async (req, res) => {
  try {
    const id = req.params.id;
    const { year_name } = req.body;

    if (!year_name) {
      return res.status(400).json({ message: 'Year name is required' });
    }

    // Check if exists
    const checkResult = await client.query(
      'SELECT id FROM master_academic_years WHERE id = $1 AND deleteflag = true',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    const result = await client.query(
      `UPDATE master_academic_years
       SET year_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleteflag = true
       RETURNING id, year_name, created_at, created_by, updated_at, updated_by`,
      [year_name, id]
    );

    res.json({
      message: 'Academic year updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteAcademicYear = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if exists
    const checkResult = await client.query(
      'SELECT id FROM master_academic_years WHERE id = $1 AND deleteflag = true',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    // Soft delete: set deleteflag to false
    await client.query(
      'UPDATE master_academic_years SET deleteflag = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSemesters = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, semester_number, program_id, academic_year_id, start_date, end_date, status FROM semesters"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get semesters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getExamTypes = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, type_name FROM exam_types"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get exam types error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getRoles = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, role_name FROM roles"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    // 1. Extract rememberMe from request body
    const { email, password, rememberMe } = req.body;

     const user = await client.query(
      `SELECT u.id, u.name, u.email, u.password, r.role_name
       FROM public.users u
       JOIN public.roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const result = user.rows[0];

    // Note: Always uncomment and use bcrypt in production!
    // const ismatch = await bcrypt.compare(password, result.password);
    // if (!ismatch) return res.status(403).json({ message: "Invalid credentials" });

    const payload = { 
      id: result.id, 
      email: result.email, 
      role: result.role_name 
    };

    // 2. Generate Access Token (Short-lived: 15 mins)
    const accessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });

    // 3. Generate Refresh Token (Long-lived: 7 days or 30 days)
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "30d" });

    // 4. Set Refresh Token in an HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,    // Protects against XSS
      secure: false,      // Requires HTTPS
      // sameSite: 'Strict', // Protects against CSRF,
      sameSite: "Lax",
      // If rememberMe is false, cookie expires when browser closes (Session Cookie)
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined 
    });

    return res.status(200).json({
      message: "User logged in successfully",
      user: { id: result.id, name: result.name, role: result.role_name },
      token: accessToken, // React stores this in memory
    });

  } catch (err) {
    console.log("Login Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUniversities = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        u.id,
        u.name,
        u.address,
        u.status,
        u.created_at,
        (SELECT COUNT(*) FROM colleges WHERE university_id = u.id) as colleges_count,
        (SELECT COUNT(*) FROM programs WHERE university_id = u.id) as programs_count,
        (SELECT COUNT(*) FROM academic_years WHERE university_id = u.id) as academic_years_count
       FROM universities u
       ORDER BY u.id`
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
    const result = await client.query(
      'INSERT INTO universities (name, address, status) VALUES ($1, $2, $3) RETURNING id, name, address, status, created_at',
      [name, address || null, status === undefined ? true : status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
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
    const { name, university_id, address, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await client.query(
      'INSERT INTO colleges (name, university_id, address, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, university_id, address || null, status === undefined ? true : status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create college error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { name, address, status } = req.body;
    const id = req.params.id;
    const result = await client.query(
      'UPDATE colleges SET name=$1, address=$2, status=$3 WHERE id=$4 RETURNING *',
      [name, address || null, status === undefined ? true : status, id]
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
    const result = await client.query(
      `SELECT s.id, u.name as student_name, u.email, s.college_id, s.program_id, s.current_semester_id, s.admission_year, s.status
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


const getColleges = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT c.id,
              c.name AS college_name,
              c.university_id,
              u.name AS university_name,
              c.address,
              c.status,
              c.created_at
       FROM colleges c
       LEFT JOIN universities u ON c.university_id = u.id`
    );
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
    t.designation,
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
  const { college_id, designation, status, name, email } = req.body;

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
           status = COALESCE($3, status)
       WHERE id = $4`,
      [college_id ?? null, designation ?? null, status ?? null, id]
    );

    // 5️⃣ Commit transaction
    await client.query("COMMIT");

    res.json({ message: "Teacher updated successfully" });

  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(400).json({ message: "Email already in use" });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getExams = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name as exam_name, semester_id, college_id, exam_type, exam_date, status FROM exams"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT m.id, m.student_id, u.name as student_name, m.subject_id, sub.name as subject_name, m.exam_id, m.marks_obtained, m.max_marks
       FROM marks m
       LEFT JOIN students s ON m.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON m.subject_id = sub.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get marks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// master_semesters CRUD
const getMasterSemesters = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, semester_name, created_at FROM master_semesters ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master semesters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterSemester = async (req, res) => {
  try {
    const { semester_name } = req.body;
    if (!semester_name) {
      return res.status(400).json({ message: "Semester name is required" });
    }
    const result = await client.query(
      "INSERT INTO master_semesters (semester_name) VALUES ($1) RETURNING id, semester_name, created_at",
      [semester_name]
    );
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
    if (!semester_name) {
      return res.status(400).json({ message: "Semester name is required" });
    }
    const result = await client.query(
      "UPDATE master_semesters SET semester_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, semester_name, created_at",
      [semester_name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master semester not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "DELETE FROM master_semesters WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master semester not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "SELECT id, semester_name, created_at FROM master_semesters WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master semester not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =================== master_subjects CRUD ===================
const getMasterSubjects = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, subject_code, name, created_at FROM master_subjects ORDER BY id"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterSubject = async (req, res) => {
  try {
    const { subject_code, name } = req.body;
    if (!subject_code || !name) {
      return res.status(400).json({ message: "Subject code and name are required" });
    }
    const result = await client.query(
      "INSERT INTO master_subjects (subject_code, name) VALUES ($1, $2) RETURNING id, subject_code, name, created_at",
      [subject_code, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "SELECT id, subject_code, name, created_at FROM master_subjects WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master subject not found" });
    }
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
    if (!subject_code || !name) {
      return res.status(400).json({ message: "Subject code and name are required" });
    }
    const result = await client.query(
      "UPDATE master_subjects SET subject_code = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, subject_code, name, created_at",
      [subject_code, name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master subject not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "DELETE FROM master_subjects WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Master subject not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master subject error:", error);
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
  getSemesters,
  getExamTypes,
  getRoles,
  Login,
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
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getStudents,
  getColleges,
  getTeachers,
  updateTeacher,
 
  getExams,
  getMarks,

   // master semesters
  getMasterSemesters,
  getMasterSemester,
  createMasterSemester,
  updateMasterSemester,
  deleteMasterSemester,

  // master subjects
  getMasterSubjects,
  getMasterSubject,
  createMasterSubject,
  updateMasterSubject,
  deleteMasterSubject
};
