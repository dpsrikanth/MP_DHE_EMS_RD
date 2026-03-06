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
      totalTeachers: "SELECT COUNT(*) FROM master_teachers",
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
      `SELECT u.id, u.name, u.email, u.password, u.password_hash, u.college_id, r.role_name FROM public.users u JOIN public.roles r ON u.role_id = r.id WHERE u.email = $1`,
      [email]
    );
    if (user.rows.length === 0) return res.status(400).json({ message: "User not found" });

    const result = user.rows[0];
    const { password: plainPassword, password_hash: hashedPassword } = result;

    // Verify password
    let isMatch = false;
    if (hashedPassword) {
      isMatch = await bcrypt.compare(password, hashedPassword);
    } else if (plainPassword) {
      isMatch = password === plainPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const payload = { id: result.id, email: result.email, role: result.role_name, college_id: result.college_id };
    const accessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "30d" });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined
    });
    res.json({ token: accessToken, user: { id: result.id, name: result.name, email: result.email, role: result.role_name, college_id: result.college_id } });
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

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // from verifyToken

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old and new passwords are required" });
    }

    const checkUser = await client.query(
      "SELECT password, password_hash FROM public.users WHERE id = $1",
      [userId]
    );

    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: plainPassword, password_hash: hashedPassword } = checkUser.rows[0];

    // Verify old password
    let isMatch = false;
    if (hashedPassword) {
      isMatch = await bcrypt.compare(oldPassword, hashedPassword);
    } else if (plainPassword) {
      // Legacy unhashed password
      isMatch = oldPassword === plainPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await client.query(
      "UPDATE public.users SET password_hash = $1, password = NULL WHERE id = $2",
      [newHashedPassword, userId]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    await client.query('UPDATE universities SET status=false WHERE id=$1', [id]);
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
    await client.query('UPDATE colleges SET status=false WHERE id=$1', [id]);
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
    const result = await client.query(`SELECT * FROM public.students
WHERE "deleteStatus" = true
ORDER BY id ASC;`);
    res.json(result.rows);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      name,
      policies,
      programName,
      admission_year,
      semister,
      collageName,
      rollnumber,
      email,
      contactNumber,
      address,
      fatherName,
      adharnumber,
      bloodgroup
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Student name is required' });

    const result = await client.query(
      `INSERT INTO students (
        name, policies, "programName", admission_year, semister, "collageName",
        rollnumber, email, "contactNumber", address, "fatherName", adharnumber,
        bloodgroup, created_at, updated_at, "deleteStatus"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
      RETURNING *`,
      [
        name,
        policies || null,
        programName || null,
        admission_year || null,
        semister || null,
        collageName || null,
        rollnumber || null,
        email || null,
        contactNumber || null,
        address || null,
        fatherName || null,
        adharnumber || null,
        bloodgroup || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      policies,
      programName,
      admission_year,
      semister,
      collageName,
      rollnumber,
      email,
      contactNumber,
      address,
      fatherName,
      adharnumber,
      bloodgroup
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Student name is required' });

    // Check if student exists
    const checkResult = await client.query(
      'SELECT id FROM students WHERE id = $1 AND "deleteStatus" = true',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const result = await client.query(
      `UPDATE students
       SET name = $1, policies = $2, "programName" = $3, admission_year = $4, semister = $5,
           "collageName" = $6, rollnumber = $7, email = $8, "contactNumber" = $9, address = $10,
           "fatherName" = $11, adharnumber = $12, bloodgroup = $13, updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND "deleteStatus" = true
       RETURNING *`,
      [
        name,
        policies || null,
        programName || null,
        admission_year || null,
        semister || null,
        collageName || null,
        rollnumber || null,
        email || null,
        contactNumber || null,
        address || null,
        fatherName || null,
        adharnumber || null,
        bloodgroup || null,
        id
      ]
    );

    res.json({ message: 'Student updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const checkResult = await client.query(
      'SELECT id FROM students WHERE id = $1 AND "deleteStatus" = true',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Soft delete: set deleteStatus to false
    await client.query(
      'UPDATE students SET "deleteStatus" = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Delete student error:', err);
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
    const result = await client.query(`
      SELECT 
        e.id, 
        e.name as exam_name, 
        e.semester_id, 
        ms.semester_name,
        e.college_id, 
        c.name as college_name,
        e.exam_type, 
        et.type_name as exam_type_name,
        e.department_id,
        md.department_name,
        e.program_id,
        mp.name as program_name,
        e.academic_year_id,
        ay.year_name,
        e.subject_id,
        sub.name as subject_name,
        e.exam_date, 
        e.status 
      FROM exams e
      LEFT JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      LEFT JOIN exam_types et ON e.exam_type = et.id
      LEFT JOIN master_departments md ON e.department_id = md.id
      LEFT JOIN master_programs mp ON e.program_id = mp.id
      LEFT JOIN master_academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN master_subjects sub ON e.subject_id = sub.id
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createExam = async (req, res) => {
  try {
    const { name, semester_id, college_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id } = req.body;
    if (!name || !semester_id || !college_id || !exam_type || !exam_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await client.query(
      "INSERT INTO exams (name, semester_id, college_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [name, semester_id, college_id, exam_type, exam_date, status ?? true, department_id || null, program_id || null, academic_year_id || null, subject_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create exam error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, semester_id, college_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id } = req.body;

    // Check if exists
    const checkResult = await client.query('SELECT id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    const result = await client.query(
      `UPDATE exams 
       SET name = COALESCE($1, name), 
           semester_id = COALESCE($2, semester_id), 
           college_id = COALESCE($3, college_id), 
           exam_type = COALESCE($4, exam_type), 
           exam_date = COALESCE($5, exam_date), 
           status = COALESCE($6, status),
           department_id = COALESCE($7, department_id),
           program_id = COALESCE($8, program_id),
           academic_year_id = COALESCE($9, academic_year_id),
           subject_id = COALESCE($10, subject_id)
       WHERE id = $11 RETURNING *`,
      [name, semester_id, college_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update exam error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const checkResult = await client.query('SELECT id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    await client.query("DELETE FROM exams WHERE id = $1", [id]);
    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const result = await client.query(`SELECT m.id, m.student_id, TRIM(s.name) as student_name, m.subject_id, sub.name as subject_name, m.exam_id, m.total_marks as marks_obtained, 100 as max_marks FROM marks m LEFT JOIN students s ON m.student_id = s.id LEFT JOIN master_subjects sub ON m.subject_id = sub.id`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get marks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- MARKS MANAGEMENT MODULE ---

const getStudentsForMarks = async (req, res) => {
  try {
    const {
      college_id,
      department_id,
      program_id,
      academic_year_id,
      semester_id,
      subject_id,
      exam_id
    } = req.query;

    if (!college_id || !department_id || !program_id || !semester_id || !subject_id) {
      return res.status(400).json({ message: "Missing required query parameters to fetch students." });
    }

    // First, lookup the actual string names for college, program, and semester
    // since the students table only stores them as raw text.
    const collegeRes = await client.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
    const programRes = await client.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
    const semRes = await client.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);

    const collegeNameText = collegeRes.rows[0]?.name || '';
    const programNameText = programRes.rows[0]?.name || '';
    const semesterNameText = semRes.rows[0]?.semester_name || '';

    // This fetches all students matching the criteria, and LEFT JOINs the marks table
    // so we get existing marks if any, or null if they haven't been entered yet.
    // Notice how students table uses string columns like "collageName" instead of foreign keys
    const query = `
      SELECT 
        s.id as student_id,
        TRIM(s.name) as student_name,
        TRIM(s.rollnumber) as enrollment_number,
        m.id as mark_id,
        m.internal_marks,
        m.external_marks,
        m.total_marks,
        m.status,
        m.teacher_id,
        m.hod_id
      FROM students s
      LEFT JOIN marks m ON s.id = m.student_id 
        AND m.subject_id = $4 
        AND (m.exam_id = $5 OR $5 IS NULL)
        AND (m.academic_year_id = $6 OR $6 IS NULL)
      WHERE s."collageName" ILIKE $1 
        AND s."programName" ILIKE $2 
        AND IFNULL(s.semister, '') ILIKE $3 
        AND s."deleteStatus" = true
      ORDER BY s.rollnumber ASC NULLS LAST, s.name ASC
    `;

    // Try a broad match since the student data is hand-typed varying text
    const semRegex = `%${semesterNameText.replace(/semester /i, '').trim()}%`;

    const values = [
      `%${collegeNameText}%`,
      `%${programNameText}%`,
      semRegex,
      subject_id,
      exam_id || null,
      academic_year_id || null
    ];

    let result;
    try {
      result = await client.query(query, values);
    } catch (err) {
      // IFNULL isn't native to pg, we should use COALESCE
      const safeQuery = query.replace("IFNULL(s.semister, '')", "COALESCE(s.semister, '')");
      result = await client.query(safeQuery, values);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Get students for marks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const saveTeacherMarks = async (req, res) => {
  try {
    // Expected body: { subject_id, exam_id, academic_year_id, marksData: [{ student_id, internal_marks, external_marks, status }] }
    const { subject_id, exam_id, academic_year_id, marksData } = req.body;
    const teacher_id = req.user.id; // From verifyToken middleware, assuming req.user.id is the teacher's user ID.
    // NOTE: Ideally, we should look up the primary key from the teachers table using req.user.id.
    // For simplicity, we query the teacher ID first if needed, otherwise rely on the payload passing the correct teacher_id.

    // Attempt to lookup the real teacher record ID
    const teacherCheck = await client.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    const actual_teacher_id = teacherCheck.rows.length > 0 ? teacherCheck.rows[0].id : null;

    if (!subject_id || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid payload format." });
    }

    await client.query("BEGIN"); // Start transaction

    for (const record of marksData) {
      if (!record.student_id) continue;

      const internal = record.internal_marks !== undefined && record.internal_marks !== '' ? parseFloat(record.internal_marks) : null;
      const external = record.external_marks !== undefined && record.external_marks !== '' ? parseFloat(record.external_marks) : null;
      const computedTotal = (internal || 0) + (external || 0);
      const rowStatus = record.status || 'Draft'; // 'Draft' or 'Pending Approval'

      // Check if marks record exists for this student/subject/exam combination
      const checkResult = await client.query(
        `SELECT id FROM marks 
         WHERE student_id = $1 AND subject_id = $2 
         AND (exam_id = $3 OR ($3 IS NULL AND exam_id IS NULL))
         AND (academic_year_id = $4 OR ($4 IS NULL AND academic_year_id IS NULL))`,
        [record.student_id, subject_id, exam_id || null, academic_year_id || null]
      );

      if (checkResult.rows.length > 0) {
        // Update existing record
        // Only allow update if status is Draft or Rejected (represented as Draft again). Don't let teacher overwrite Approved marks.
        await client.query(
          `UPDATE marks 
           SET internal_marks = $1, external_marks = $2, total_marks = $3, status = $4, teacher_id = $5 
           WHERE id = $6 AND status != 'Approved'`,
          [internal, external, computedTotal, rowStatus, actual_teacher_id, checkResult.rows[0].id]
        );
      } else {
        // Insert new record
        await client.query(
          `INSERT INTO marks (student_id, subject_id, exam_id, academic_year_id, internal_marks, external_marks, total_marks, status, teacher_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [record.student_id, subject_id, exam_id || null, academic_year_id || null, internal, external, computedTotal, rowStatus, actual_teacher_id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Marks saved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Save teacher marks error:", error);
    res.status(500).json({ message: "Failed to save marks", error: error.message });
  }
};

const getMarksForApproval = async (req, res) => {
  try {
    const { college_id, department_id } = req.query;

    let collegeNameText = '';
    if (college_id) {
      const collegeRes = await client.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
      collegeNameText = collegeRes.rows[0]?.name || '';
    }

    // Fetch all marks that are pending approval for a specific department
    let query = `
      SELECT 
        m.id as mark_id,
        s.id as student_id,
        TRIM(s.name) as student_name,
        TRIM(s.rollnumber) as enrollment_number,
        sub.name as subject_name,
        sub.subject_code,
        m.internal_marks,
        m.external_marks,
        m.total_marks,
        m.status,
        tu.name as submitted_by
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN master_subjects sub ON m.subject_id = sub.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      WHERE m.status = 'Pending Approval'
    `;

    const values = [];
    if (college_id) {
      values.push(`%${collegeNameText}%`);
      query += ` AND s."collageName" ILIKE $${values.length}`;
    }
    // We ignore department_id since students don't have a department string directly

    query += ` ORDER BY sub.name, TRIM(s.name)`;

    const result = await client.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Get marks for approval error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const approveRejectMarks = async (req, res) => {
  try {
    // action should be 'Approve' or 'Reject'
    const { mark_ids, action } = req.body;

    if (!mark_ids || !Array.isArray(mark_ids) || mark_ids.length === 0) {
      return res.status(400).json({ message: "No records provided." });
    }
    if (action !== 'Approve' && action !== 'Reject') {
      return res.status(400).json({ message: "Invalid action." });
    }

    const newStatus = action === 'Approve' ? 'Approved' : 'Draft';

    // Find HOD id
    const hodCheck = await client.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    const hod_id = hodCheck.rows.length > 0 ? hodCheck.rows[0].id : null;

    // Build parameterized array string: $3, $4, $5...
    const placeholders = mark_ids.map((_, i) => `$${i + 3}`).join(',');

    await client.query(
      `UPDATE marks 
       SET status = $1, hod_id = $2 
       WHERE id IN (${placeholders}) AND status = 'Pending Approval'`,
      [newStatus, hod_id, ...mark_ids]
    );

    res.json({ message: `Successfully ${action.toLowerCase()}ed ${mark_ids.length} records.` });
  } catch (error) {
    console.error("Approve/Reject marks error:", error);
    res.status(500).json({ message: "Failed to process marks approval", error: error.message });
  }
};

const getMasterSemesters = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, semester_name, status, created_at FROM master_semesters WHERE status IS NULL OR status = 'Active' ORDER BY id`
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
    if (!semester_name) return res.status(400).json({ message: "Semester name is required" });
    const result = await client.query("INSERT INTO master_semesters (semester_name, status) VALUES ($1, 'Active') RETURNING id, semester_name, status, created_at", [semester_name]);
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
    // Soft delete: Update status to 'Inactive' instead of deleting the record
    const result = await client.query(
      `UPDATE master_semesters
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Master semester not found" });
    res.json({ success: true, message: "Semester record deleted successfully", data: { id: result.rows[0].id } });
  } catch (error) {
    console.error("Delete master semester error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, semester_name, status, created_at FROM master_semesters WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master semester not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master semester error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSubjects = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, subject_code, name, status, created_at FROM master_subjects WHERE status IS NULL OR status = 'Active' ORDER BY id`
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
    if (!subject_code || !name) return res.status(400).json({ message: "Subject code and name are required" });
    const result = await client.query("INSERT INTO master_subjects (subject_code, name, status) VALUES ($1, $2, 'Active') RETURNING id, subject_code, name, status, created_at", [subject_code, name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, subject_code, name, status, created_at FROM master_subjects WHERE id = $1", [id]);
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
    // Soft delete: Update status to 'Inactive' instead of deleting the record
    const result = await client.query(
      `UPDATE master_subjects
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Master subject not found" });
    res.json({ success: true, message: "Subject record deleted successfully", data: { id: result.rows[0].id } });
  } catch (error) {
    console.error("Delete master subject error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getMasterPrograms = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, name, duration_years, status, created_at FROM master_programs WHERE status IS NULL OR status = 'Active' ORDER BY id`
    );
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
    const result = await client.query("INSERT INTO master_programs (name, duration_years, status) VALUES ($1, $2, 'Active') RETURNING id, name, duration_years, status, created_at", [name, duration_years]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, name, duration_years, status, created_at FROM master_programs WHERE id = $1", [id]);
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
    // Soft delete: Update status to 'Inactive' instead of deleting the record
    const result = await client.query(
      `UPDATE master_programs
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Master program not found" });
    res.json({ success: true, message: "Program record deleted successfully", data: { id: result.rows[0].id } });
  } catch (error) {
    console.error("Delete master program error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const getMasterPolicies = async (req, res) => {
  try {
    const result = await client.query('SELECT id, name, description, status, created_at FROM master_policies ORDER BY id');
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
    const result = await client.query("INSERT INTO master_policies (name, description, status) VALUES ($1, $2, true) RETURNING id, name, description, status, created_at", [name, description]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT id, name, description, status, created_at FROM master_policies WHERE id = $1", [id]);
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
      "UPDATE master_policies SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, description, status, created_at",
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
    const result = await client.query("UPDATE master_policies SET status = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master policy not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete master policy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get College Master Policy - Get policy ID for a college
const getCollegeMasterPolicy = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    // Query the college_master_policies table to get the policy_id for this college
    const result = await client.query(
      `SELECT policy_id FROM college_master_policies WHERE college_id = $1 LIMIT 1`,
      [collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No policy found for this college" });
    }

    res.json({ policy_id: result.rows[0].policy_id });
  } catch (error) {
    console.error("Get college master policy error:", error);
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
        mt.qualification,
        mt.experience_years AS experience,
        mt.specialization,
        mt.pan_no,
        mt.aadhaar_no,
        mt.dob,
        mt.gender,
        mt.status,
        mt.joining_date,
        mt.phone,
        mt.address
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
        mt.specialization,
        mt.pan_no,
        mt.aadhaar_no,
        mt.dob,
        mt.gender,
        mt.joining_date,
        mt.phone,
        mt.address,
        mt.status,
        mt.qualification,
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
  const { name, email, college_id, department_id, designation_id, employee_code, experience, qualification, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status } = req.body;

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
      `INSERT INTO master_teachers (user_id, employee_code, college_id, department_id, designation_id, qualification, experience_years, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id, user_id, employee_code, college_id, department_id, designation_id, qualification, experience_years, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status`,
      [userId, finalEmployeeCode, college_id, department_id, designation_id, qualification || null, experience || 0, specialization || null, pan_no || null, aadhaar_no || null, dob || null, gender || null, joining_date || null, phone || null, address || null, status || 'Active']
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
        mt.qualification,
        mt.experience_years AS experience,
        mt.specialization,
        mt.pan_no,
        mt.aadhaar_no,
        mt.dob,
        mt.gender,
        mt.joining_date,
        mt.phone,
        mt.address,
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
  // pull every possible field from the body; some may be undefined
  const {
    name,
    email,
    college_id,
    department_id,
    designation_id,
    qualification,
    experience,
    specialization,
    pan_no,
    aadhaar_no,
    dob,
    gender,
    joining_date,
    phone,
    address,
    status
  } = req.body;

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
           qualification = COALESCE($5, qualification),
           experience_years = COALESCE($6, experience_years),
           specialization = COALESCE($7, specialization),
           pan_no = COALESCE($8, pan_no),
           aadhaar_no = COALESCE($9, aadhaar_no),
           dob = COALESCE($10, dob),
           gender = COALESCE($11, gender),
           joining_date = COALESCE($12, joining_date),
           phone = COALESCE($13, phone),
           address = COALESCE($14, address),
           status = COALESCE($15, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [
        id,
        college_id || null,
        department_id || null,
        designation_id || null,
        qualification || null,
        experience || null,
        specialization || null,
        pan_no || null,
        aadhaar_no || null,
        dob || null,
        gender || null,
        joining_date || null,
        phone || null,
        address || null,
        status || null
      ]
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
        mt.qualification,
        mt.experience_years AS experience,
        mt.specialization,
        mt.pan_no,
        mt.aadhaar_no,
        mt.dob,
        mt.gender,
        mt.joining_date,
        mt.phone,
        mt.address,
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

// College-specific Cascading Data Functions
const getCollegeSemesters = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    const result = await client.query(
      `SELECT DISTINCT ms.id, ms.semester_name
       FROM master_semesters ms
       INNER JOIN college_master_semesters cms ON ms.id = cms.semester_id
       WHERE cms.college_id = $1 AND (ms.status = 'Active' OR ms.status IS NULL)
       ORDER BY ms.id ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get college semesters error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCollegePrograms = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    const result = await client.query(
      `SELECT DISTINCT mp.id, mp.name
       FROM master_programs mp
       INNER JOIN college_master_programs cmp ON mp.id = cmp.program_id
       WHERE cmp.college_id = $1 AND (mp.status = 'Active' OR mp.status IS NULL)
       ORDER BY mp.id ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get college programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCollegePolicies = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    const result = await client.query(
      `SELECT DISTINCT mp.id, mp.name
       FROM master_policies mp
       INNER JOIN college_master_policies cmp ON mp.id = cmp.policy_id
       WHERE cmp.college_id = $1 AND mp.status = true
       ORDER BY mp.id ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get college policies error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCollegeAcademicYears = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    const result = await client.query(
      `SELECT DISTINCT may.id, may.year_name
       FROM master_academic_years may
       INNER JOIN college_master_academic_years cmay ON may.id = cmay.academic_year_id
       WHERE cmay.college_id = $1 AND may.deleteflag = true
       ORDER BY may.id ASC`,
      [collegeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get college academic years error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "SELECT id, department_name, department_code, college_id, status FROM master_departments WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Master department not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master department error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name, department_code, college_id, status } = req.body;

    if (!department_name || !college_id) {
      return res.status(400).json({ message: "Department name and college are required" });
    }

    const result = await client.query(
      `UPDATE master_departments 
       SET department_name = $1, department_code = $2, college_id = $3, status = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, department_name, department_code, college_id, status`,
      [department_name, department_code, college_id, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Master department not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update master department error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ message: "Department code or name already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `UPDATE master_departments 
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Master department not found" });
    res.json({ success: true, message: "Department record deleted successfully", data: { id: result.rows[0].id } });
  } catch (error) {
    console.error("Delete master department error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  changePassword,
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
  updateStudent,
  deleteStudent,
  getColleges,
  getTeachers,
  updateTeacher,
  getExams,
  createExam,
  updateExam,
  deleteExam,
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
  getCollegeMasterPolicy,
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
  createMasterDepartment,
  // college cascading data
  getCollegeSemesters,
  getCollegePrograms,
  getCollegePolicies,
  getCollegeAcademicYears,
  getMasterDepartment,
  updateMasterDepartment,
  deleteMasterDepartment,
  // mark module additions
  getStudentsForMarks,
  saveTeacherMarks,
  getMarksForApproval,
  approveRejectMarks
};