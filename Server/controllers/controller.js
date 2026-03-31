require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const client = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");// Register endpoint
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
      "INSERT INTO public.users (name, email, password_hash, role_id, college_id, university_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role_id",
      [name, email, hashedPassword, roleId, req.body.college_id || null, req.body.university_id || null],
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
    const { id, role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;

    const uId = (role === 'superadmin' && req.query.universityId)
      ? req.query.universityId
      : (role === 'university_admin' ? university_id : null);

    let statsQueries;

    if (uId) {
      const p = [uId];
      statsQueries = {
        totalTeachers:     { q: `SELECT COUNT(*) FROM master_teachers mt JOIN colleges c ON mt.college_id = c.id WHERE c.university_id = $1 AND (mt.status = 'Active' OR mt.status IS NULL) AND (c.status = true OR c.status IS NULL)`, p },
        activeExams:       { q: `SELECT COUNT(*) FROM exams e JOIN colleges c ON e.college_id = c.id WHERE c.university_id = $1 AND (e.status = true OR e.status IS NULL) AND (c.status = true OR c.status IS NULL)`, p },
        totalPrograms:     { q: `SELECT COUNT(*) FROM university_master_programs WHERE university_id = $1`, p },
        totalSemesters:    { q: `SELECT COUNT(*) FROM university_master_semesters WHERE university_id = $1`, p },
        totalSubjects:     { q: `SELECT COUNT(*) FROM master_subjects s JOIN university_master_programs ump ON s.program_id = ump.program_id WHERE ump.university_id = $1 AND (s.status = 'Active' OR s.status IS NULL)`, p },
        totalAcademicYears:{ q: `SELECT COUNT(*) FROM university_master_academic_years WHERE university_id = $1`, p },
        totalPolicies:     { q: `SELECT COUNT(*) FROM master_policies WHERE status = true OR status IS NULL`, p: [] },
      };
    } else {
      statsQueries = {
        totalTeachers:     { q: "SELECT COUNT(*) FROM master_teachers", p: [] },
        activeExams:       { q: "SELECT COUNT(*) FROM exams", p: [] },
        totalPrograms:     { q: "SELECT COUNT(*) FROM master_programs", p: [] },
        totalSemesters:    { q: "SELECT COUNT(*) FROM master_semesters", p: [] },
        totalSubjects:     { q: "SELECT COUNT(*) FROM master_subjects", p: [] },
        totalAcademicYears:{ q: "SELECT COUNT(*) FROM master_academic_years", p: [] },
        totalPolicies:     { q: "SELECT COUNT(*) FROM master_policies WHERE status = true OR status IS NULL", p: [] },
      };
    }

    const stats = {};
    for (const [key, { q, p }] of Object.entries(statsQueries)) {
      const result = await client.query(q, p);
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
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    let query = `
      SELECT DISTINCT u.id, u.name, u.email, u.role_id, u.is_active, u.created_at, 
             r.role_name, 
             COALESCE(c_mt.name, c.name, c_t.name, c_s.name) as college_name,
             COALESCE(univ_mt.name, univ.name, univ_t.name, univ_s.name) as university_name
      FROM public.users u
      LEFT JOIN public.roles r ON u.role_id = r.id
      LEFT JOIN public.colleges c ON u.college_id = c.id
      LEFT JOIN public.universities univ ON u.university_id = univ.id
      -- Master Teachers Join
      LEFT JOIN public.master_teachers mt ON u.id = mt.user_id
      LEFT JOIN public.colleges c_mt ON mt.college_id = c_mt.id
      LEFT JOIN public.universities univ_mt ON c_mt.university_id = univ_mt.id
      -- Old Teachers Join
      LEFT JOIN public.teachers t ON u.id = t.user_id
      LEFT JOIN public.colleges c_t ON t.college_id = c_t.id
      LEFT JOIN public.universities univ_t ON c_t.university_id = univ_t.id
      -- Students Join
      LEFT JOIN public.students s ON u.email = s.email
      LEFT JOIN public.colleges c_s ON s."collageName" ILIKE c_s.name
      LEFT JOIN public.universities univ_s ON c_s.university_id = univ_s.id
    `;
    const params = [];

    if (role === 'university_admin' && university_id) {
      query += " WHERE (u.university_id = $1 OR c.university_id = $1 OR c_mt.university_id = $1 OR c_t.university_id = $1 OR c_s.university_id = $1)";
      params.push(university_id);
    } else if (role === 'college_admin' && req.user.college_id) {
      query += " WHERE (u.college_id = $1 OR mt.college_id = $1 OR t.college_id = $1 OR c_s.id = $1)";
      params.push(req.user.college_id);
    }

    query += " ORDER BY u.created_at DESC";
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role_id, college_id, university_id } = req.body;
    const { role: requesterRole } = req.user || {};
    const requesterUnivId = req.user?.university_id || req.user?.universityId;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    // Role-based security for user creation
    if (requesterRole === 'university_admin') {
      const roleResult = await client.query("SELECT role_name FROM roles WHERE id = $1", [role_id]);
      if (roleResult.rows.length === 0) return res.status(400).json({ message: "Invalid role" });
      const targetRole = roleResult.rows[0].role_name;
      if (['superadmin', 'university_admin'].includes(targetRole)) {
        return res.status(403).json({ message: "Unauthorized to assign this role" });
      }
      // Enforce university_id for university_admin
      if (university_id != requesterUnivId) {
        return res.status(403).json({ message: "Unauthorized to create user for another university" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await client.query(
      "INSERT INTO public.users (name, email, password_hash, role_id, college_id, university_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email",
      [name, email, hashedPassword, role_id, college_id || null, university_id || null]
    );
    res.status(201).json({ message: "User created successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role_id, college_id, university_id, is_active } = req.body;
    const { role: requesterRole } = req.user || {};
    const requesterUnivId = req.user?.university_id || req.user?.universityId;

    // Security check for university_admin
    if (requesterRole === 'university_admin') {
      const existingUser = await client.query("SELECT university_id FROM public.users WHERE id = $1", [id]);
      if (existingUser.rows.length === 0) return res.status(404).json({ message: "User not found" });
      if (existingUser.rows[0].university_id != requesterUnivId) {
        return res.status(403).json({ message: "Unauthorized to update this user" });
      }
      
      if (role_id) {
        const roleResult = await client.query("SELECT role_name FROM roles WHERE id = $1", [role_id]);
        if (roleResult.rows.length > 0) {
          const targetRole = roleResult.rows[0].role_name;
          if (['superadmin', 'university_admin'].includes(targetRole)) {
            return res.status(403).json({ message: "Unauthorized to assign this role" });
          }
        }
      }
      // Enforce university_id stay the same if provided
      if (university_id && university_id != requesterUnivId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
    }
    
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        "UPDATE public.users SET name = $1, email = $2, password_hash = $3, role_id = $4, college_id = $5, university_id = $6, is_active = $7 WHERE id = $8",
        [name, email, hashedPassword, role_id || null, college_id || null, university_id || null, is_active, id]
      );
    } else {
      await client.query(
        "UPDATE public.users SET name = $1, email = $2, role_id = $3, college_id = $4, university_id = $5, is_active = $6 WHERE id = $7",
        [name, email, role_id || null, college_id || null, university_id || null, is_active, id]
      );
    }
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await client.query("DELETE FROM public.users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPrograms = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    let query = "SELECT id, name, duration_years, university_id, status FROM programs";
    const params = [];

    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);

    if (uId) {
      query = `SELECT p.id, p.name, p.duration_years, p.university_id, p.status 
               FROM master_programs p 
               JOIN university_master_programs ump ON p.id = ump.program_id 
               WHERE ump.university_id = $1 AND (p.status IS NULL OR p.status = 'Active')`;
      params.push(uId);
    }

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    let query = "SELECT s.id, s.name, s.program_id, s.semester_id, s.credits, s.status FROM subjects s";
    const params = [];

    if (role === 'university_admin' && university_id) {
      query += ` JOIN programs p ON s.program_id = p.id 
                 WHERE (p.university_id = $1 OR EXISTS (SELECT 1 FROM university_master_programs ump WHERE ump.program_id = p.id AND ump.university_id = $1))`;
      params.push(university_id);
    }

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    let query = "SELECT id, year_name, created_at, created_by, updated_at, updated_by FROM master_academic_years WHERE deleteflag = true";
    const params = [];

    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);

    if (uId) {
      query = `SELECT ay.id, ay.year_name, ay.created_at, ay.created_by, ay.updated_at, ay.updated_by 
               FROM master_academic_years ay
               JOIN university_master_academic_years umay ON ay.id = umay.academic_year_id
               WHERE ay.deleteflag = true AND umay.university_id = $1`;
      params.push(uId);
    }

    query += " ORDER BY id DESC";
    const result = await client.query(query, params);
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
    const { role, university_id } = req.user || {};
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = "SELECT id, semester_number, program_id, academic_year_id, start_date, end_date, status FROM semesters";
    const params = [];

    if (uId) {
      query = `SELECT s.id, s.semester_name, s.status 
               FROM master_semesters s 
               JOIN university_master_semesters ums ON s.id = ums.semester_id 
               WHERE ums.university_id = $1 AND (s.status IS NULL OR s.status = 'Active')`;
      params.push(uId);
    }

    const result = await client.query(query, params);
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
    const { role } = req.user || {};
    let query = "SELECT id, role_name FROM roles";
    const params = [];

    if (role === 'university_admin') {
      query += " WHERE role_name NOT IN ('superadmin', 'university_admin')";
    } else if (role === 'college_admin') {
      query += " WHERE role_name NOT IN ('superadmin', 'university_admin', 'college_admin')";
    } else if (role === 'HOD') {
      query += " WHERE role_name NOT IN ('superadmin', 'university_admin', 'college_admin', 'HOD')";
    }

    query += " ORDER BY id ASC";
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'superadmin') {
      return res.status(403).json({ message: "Unauthorized to create roles" });
    }
    const { role_name } = req.body;
    if (!role_name) return res.status(400).json({ message: "Role name is required" });
    const result = await client.query("INSERT INTO roles (role_name) VALUES ($1) RETURNING *", [role_name]);
    res.status(201).json({ message: "Role created successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'superadmin') {
      return res.status(403).json({ message: "Unauthorized to update roles" });
    }
    const { id } = req.params;
    const { role_name } = req.body;
    await client.query("UPDATE roles SET role_name = $1 WHERE id = $2", [role_name, id]);
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { role } = req.user || {};
    if (role !== 'superadmin') {
      return res.status(403).json({ message: "Unauthorized to delete roles" });
    }
    const { id } = req.params;
    await client.query("DELETE FROM roles WHERE id = $1", [id]);
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await client.query(
      `SELECT u.id, u.name, u.email, u.password, u.password_hash, 
              COALESCE(mt.college_id, sc.id, u.college_id) as college_id, 
              COALESCE(u.university_id, sc.university_id) as university_id, 
              r.role_name, mt.id as teacher_id, mt.department_id 
       FROM public.users u 
       JOIN public.roles r ON u.role_id = r.id 
       LEFT JOIN public.master_teachers mt ON mt.user_id = u.id
       LEFT JOIN public.students s ON s.user_id = u.id
       LEFT JOIN public.colleges sc ON s."collageName" ILIKE sc.name
       WHERE u.email = $1`,
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
    const payload = {
      id: result.id,
      email: result.email,
      role: result.role_name,
      college_id: result.college_id,
      university_id: result.university_id,
      teacher_id: result.teacher_id,
      department_id: result.department_id
    };
    const accessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "30d" });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined
    });
    res.json({
      token: accessToken,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role_name,
        college_id: result.college_id,
        university_id: result.university_id,
        teacher_id: result.teacher_id,
        department_id: result.department_id
      }
    });
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
      const payload = { 
        id: decoded.id, 
        email: decoded.email, 
        role: decoded.role,
        college_id: decoded.college_id,
        university_id: decoded.university_id,
        teacher_id: decoded.teacher_id,
        department_id: decoded.department_id
      };
      const newAccessToken = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "15m" });
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
    const { role, university_id } = req.user || {};
    let query = `
      SELECT u.id, u.name, u.address, u.status, u.created_at,
        (SELECT COUNT(*) FROM colleges WHERE university_id = u.id AND (status = true OR status IS NULL)) as colleges_count,
        (SELECT COUNT(*) FROM programs WHERE university_id = u.id AND (status = true OR status IS NULL)) as programs_count,
        (SELECT COUNT(*) FROM academic_years WHERE university_id = u.id AND (status = true OR status IS NULL)) as academic_years_count
       FROM universities u
    `;
    const params = [];

    if (role === 'university_admin' && university_id) {
      query += " WHERE u.id = $1";
      params.push(university_id);
    }

    query += " ORDER BY u.id";
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get universities error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUniversity = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { name, address, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    await dbClient.query('BEGIN');
    const universityResult = await dbClient.query(
      'INSERT INTO universities (name, address, status) VALUES ($1, $2, $3) RETURNING id, name, address, status, created_at',
      [name, address || null, status === undefined ? true : status]
    );
    const newUniversity = universityResult.rows[0];
    await dbClient.query(
      'INSERT INTO colleges (name, university_id, address, status) VALUES ($1, $2, $3, $4)',
      [name, newUniversity.id, address || null, status === undefined ? true : status]
    );
    await dbClient.query('COMMIT');
    res.status(201).json(newUniversity);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Create university error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    dbClient.release();
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
    const { role, college_id } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    let query = `SELECT s.* FROM public.students s`;
    const params = [];

    if (role === 'university_admin') {
      if (!university_id) return res.json([]);
      query = `
        SELECT s.* 
        FROM public.students s
        JOIN public.colleges c ON s."collageName" ILIKE c.name
        WHERE s."deleteStatus" = true AND c.university_id = $1
      `;
      params.push(university_id);
    } else if (role === 'college_admin') {
      query = `
        SELECT s.* 
        FROM public.students s
        JOIN public.colleges c ON s."collageName" ILIKE c.name
        WHERE s."deleteStatus" = true AND c.id = $1
      `;
      params.push(college_id);
    } else {
      query += ` WHERE s."deleteStatus" = true`;
    }

    query += ` ORDER BY s.id ASC`;

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      name, policies, programName, admission_year, semister, collageName,
      rollnumber, email, contactNumber, address, fatherName, adharnumber,
      bloodgroup, admission_no, admission_date, first_name, middle_name,
      last_name, batch, section, date_of_birth, gender, student_status,
      rte, birth_place, hostel_or_day_scholar, country, state, city,
      pin_code, language, phone, sms_enabled, ems_enabled, address_line_1,
      father_first_name, father_last_name, father_mobile_phone,
      father_address_email, father_state, father_pin_code, mother_first_name,
      mother_last_name, mother_mobile_phone, mother_address_email,
      mother_state, mother_pin_code
    } = req.body;

    if (!first_name) return res.status(400).json({ message: 'First name is required' });

    const result = await client.query(
      `INSERT INTO students (
        name, policies, "programName", admission_year, semister, "collageName",
        rollnumber, email, "contactNumber", address, "fatherName", adharnumber,
        bloodgroup, admission_no, admission_date, first_name, middle_name,
        last_name, batch, section, date_of_birth, gender, student_status,
        rte, birth_place, hostel_or_day_scholar, country, state, city,
        pin_code, language, phone, sms_enabled, ems_enabled, address_line_1,
        father_first_name, father_last_name, father_mobile_phone,
        father_address_email, father_state, father_pin_code, mother_first_name,
        mother_last_name, mother_mobile_phone, mother_address_email,
        mother_state, mother_pin_code, created_at, updated_at, "deleteStatus"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
        $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
      RETURNING *`,
      [
        name || null,
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
        admission_no || null,
        admission_date || null,
        first_name || null,
        middle_name || null,
        last_name || null,
        batch || null,
        section || null,
        date_of_birth || null,
        gender || null,
        student_status || null,
        rte || null,
        birth_place || null,
        hostel_or_day_scholar || null,
        country || null,
        state || null,
        city || null,
        pin_code || null,
        language || null,
        phone || null,
        sms_enabled || null,
        ems_enabled || null,
        address_line_1 || null,
        father_first_name || null,
        father_last_name || null,
        father_mobile_phone || null,
        father_address_email || null,
        father_state || null,
        father_pin_code || null,
        mother_first_name || null,
        mother_last_name || null,
        mother_mobile_phone || null,
        mother_address_email || null,
        mother_state || null,
        mother_pin_code || null
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
      name, policies, programName, admission_year, semister, collageName,
      rollnumber, email, contactNumber, address, fatherName, adharnumber,
      bloodgroup, admission_no, admission_date, first_name, middle_name,
      last_name, batch, section, date_of_birth, gender, student_status,
      rte, birth_place, hostel_or_day_scholar, country, state, city,
      pin_code, language, phone, sms_enabled, ems_enabled, address_line_1,
      father_first_name, father_last_name, father_mobile_phone,
      father_address_email, father_state, father_pin_code, mother_first_name,
      mother_last_name, mother_mobile_phone, mother_address_email,
      mother_state, mother_pin_code
    } = req.body;

    if (!first_name) return res.status(400).json({ message: 'First name is required' });

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
           "fatherName" = $11, adharnumber = $12, bloodgroup = $13, admission_no = $14,
           admission_date = $15, first_name = $16, middle_name = $17, last_name = $18,
           batch = $19, section = $20, date_of_birth = $21, gender = $22,
           student_status = $23, rte = $24, birth_place = $25, hostel_or_day_scholar = $26,
           country = $27, state = $28, city = $29, pin_code = $30, language = $31,
           phone = $32, sms_enabled = $33, ems_enabled = $34, address_line_1 = $35,
           father_first_name = $36, father_last_name = $37, father_mobile_phone = $38,
           father_address_email = $39, father_state = $40, father_pin_code = $41,
           mother_first_name = $42, mother_last_name = $43, mother_mobile_phone = $44,
           mother_address_email = $45, mother_state = $46, mother_pin_code = $47,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $48 AND "deleteStatus" = true
       RETURNING *`,
      [
        name || null,
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
        admission_no || null,
        admission_date || null,
        first_name || null,
        middle_name || null,
        last_name || null,
        batch || null,
        section || null,
        date_of_birth || null,
        gender || null,
        student_status || null,
        rte || null,
        birth_place || null,
        hostel_or_day_scholar || null,
        country || null,
        state || null,
        city || null,
        pin_code || null,
        language || null,
        phone || null,
        sms_enabled || null,
        ems_enabled || null,
        address_line_1 || null,
        father_first_name || null,
        father_last_name || null,
        father_mobile_phone || null,
        father_address_email || null,
        father_state || null,
        father_pin_code || null,
        mother_first_name || null,
        mother_last_name || null,
        mother_mobile_phone || null,
        mother_address_email || null,
        mother_state || null,
        mother_pin_code || null,
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
    const { role, university_id } = req.user || {};
    let query = `
      SELECT c.id, c.name AS college_name, c.college_code, c.university_id, 
             u.name AS university_name, c.address, c.status, c.created_at 
      FROM colleges c 
      LEFT JOIN universities u ON c.university_id = u.id
    `;
    const params = [];

    if (role === 'university_admin') {
      if (!university_id) return res.json([]);
      query += " WHERE c.university_id = $1 AND (c.status = true OR c.status IS NULL)";
      params.push(university_id);
    } else if (role === 'college_admin') {
      if (!req.user.college_id) return res.json([]);
      query += " WHERE c.id = $1 AND (c.status = true OR c.status IS NULL)";
      params.push(req.user.college_id);
    } else {
      query += " WHERE (c.status = true OR c.status IS NULL)";
    }

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get colleges error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTeachers = async (req, res) => {
  try {
    const { role, college_id, department_id } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    let query = `
      SELECT 
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
    `;
    const params = [];
    const uId = university_id;

    if (role === 'college_admin') {
      query += ` WHERE t.college_id = $1 AND (t.status = true OR t.status IS NULL)`;
      params.push(college_id);
    } else if (role === 'HOD') {
      query += ` WHERE t.college_id = $1 AND t.department = (SELECT department_name FROM master_departments WHERE id = $2) AND (t.status = true OR t.status IS NULL)`;
      params.push(college_id, department_id);
    } else if (role === 'university_admin' && uId) {
      query += ` WHERE c.university_id = $1 AND (t.status = true OR t.status IS NULL)`;
      params.push(uId);
    } else {
      query += ` WHERE (t.status = true OR t.status IS NULL)`;
    }

    query += ` ORDER BY t.id DESC`;

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { college_id, designation, department, experience, status, name, email } = req.body;

  const dbClient = await client.connect();
  try {
    // 1️⃣ Check if teacher exists
    const teacherResult = await dbClient.query(
      "SELECT * FROM teachers WHERE id = $1",
      [id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teacher = teacherResult.rows[0];

    // 2️⃣ Start transaction
    await dbClient.query("BEGIN");

    // 3️⃣ Update users table (if name or email provided)
    if (name || email) {
      await dbClient.query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email)
         WHERE id = $3`,
        [name || null, email || null, teacher.user_id]
      );
    }

    // 4️⃣ Update teachers table
    await dbClient.query(
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
    await dbClient.query("COMMIT");
    res.json({ message: "Teacher updated successfully" });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    if (error.code === "23505") return res.status(400).json({ message: "Email already in use" });
    console.error(error);
    res.status(500).json({ message: "Server error" });
  } finally {
    dbClient.release();
  }
};


// Create teacher record (used by frontend when adding new faculty)
const createTeacher = async (req, res) => {
  const { teacher_name, email, college_id, designation, department, experience, status } = req.body;

  if (!teacher_name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const dbClient = await client.connect();
  try {
    // begin transaction
    await dbClient.query('BEGIN');
    // insert user
    const userResult = await dbClient.query(
      'INSERT INTO users (name, email, university_id, college_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [teacher_name, email, req.user?.university_id || req.user?.universityId || null, college_id || null]
    );
    const userId = userResult.rows[0].id;

    // insert teacher
    const teacherResult = await dbClient.query(
      `INSERT INTO teachers (user_id, college_id, designation, department, experience, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, college_id || null, designation || null, department || null, experience || null, status || true]
    );

    await dbClient.query('COMMIT');
    res.status(201).json({ message: 'Teacher created successfully', id: teacherResult.rows[0].id });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already in use' });
    }
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    dbClient.release();
  }
};

const getExams = async (req, res) => {
  try {
    const { role, college_id } = req.user;
    const params = [];
    let visibilityClause = '';

    if (role === 'college_admin') {
      visibilityClause = `WHERE (e.college_id = $1 OR (e.exam_type = 2 AND e.college_id IS NULL AND e.university_id = (SELECT university_id FROM colleges WHERE id = $1)))`;
      params.push(college_id);
    } else if (role === 'HOD') {
      const { department_id } = req.user;
      visibilityClause = `WHERE (e.college_id = $1 OR (e.exam_type = 2 AND e.college_id IS NULL AND e.university_id = (SELECT university_id FROM colleges WHERE id = $1))) AND e.department_id = $2`;
      params.push(college_id, department_id);
    } else if (role === 'university_admin') {
      const university_id = req.user?.university_id || req.user?.universityId;
      visibilityClause = `WHERE (e.university_id = $1 OR c.university_id = $1)`;
      params.push(university_id);
    }

    let query = `
      SELECT 
        e.id, 
        e.name as exam_name, 
        e.semester_id, 
        ms.semester_name,
        e.college_id, 
        e.university_id,
        COALESCE(c.name, COALESCE(u.name, 'University-wide')) as college_name,
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
        e.start_time,
        e.end_time,
        e.status,
        e.is_published,
        e.student_application_open,
        (SELECT EXISTS (
          SELECT 1 FROM internal_marks_structure ims 
          WHERE ims.college_id = COALESCE(e.college_id, ${params.length > 0 ? '$1' : 'null'}) 
          AND ims.department_id = e.department_id 
          AND ims.program_id = e.program_id 
          AND ims.subject_id = e.subject_id
        )) as has_marks_structure
      FROM exams e
      LEFT JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      LEFT JOIN universities u ON e.university_id = u.id
      LEFT JOIN exam_types et ON e.exam_type = et.id
      LEFT JOIN master_departments md ON e.department_id = md.id
      LEFT JOIN master_programs mp ON e.program_id = mp.id
      LEFT JOIN master_academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN master_subjects sub ON e.subject_id = sub.id
      ${visibilityClause}
      ORDER BY e.created_at DESC
    `;
    
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createExam = async (req, res) => {
  try {
    const { role, college_id: userCollegeId, department_id: userDepartmentId } = req.user;
    let { name, semester_id, college_id, university_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id, start_time, end_time, subjects } = req.body;
    
    // Normalize empty string to null (university-wide exam)
    college_id = college_id === '' ? null : college_id;

    // Enforce college_id, department_id, and university_id for restricted roles
    if (role === 'college_admin') {
      college_id = userCollegeId;
    } else if (role === 'HOD') {
      college_id = userCollegeId;
      department_id = userDepartmentId;
    } else if (role === 'university_admin') {
      university_id = req.user?.university_id || req.user?.universityId;
    }

    // --- Capacity Validation Logic ---
    if (college_id && program_id && semester_id) {
       // 1. Get student count (Matching logic with students table strings)
       const studentCountRes = await client.query(
         `SELECT COUNT(*) FROM students 
          WHERE "collageName" = (SELECT name FROM colleges WHERE id = $1)
          AND "programName" = (SELECT name FROM master_programs WHERE id = $2)
          AND semister = (SELECT semester_name FROM master_semesters WHERE id = $3)
          AND "deleteStatus" = true`,
         [college_id, program_id, semester_id]
       );
       const studentCount = parseInt(studentCountRes.rows[0].count);

       // 2. Get total approved capacity for the college
       const capacityRes = await client.query(
         `SELECT SUM(rows * seats_per_row) as total_capacity 
          FROM examination_halls 
          WHERE college_id = $1 AND status = 'Approved'`,
         [college_id]
       );
       const totalCapacity = parseInt(capacityRes.rows[0].total_capacity) || 0;

       // 3. Compare and potentially block (Unless it's a dry run or user acknowledges?)
       // User requirement: "block overbooking and send shortage request"
       if (studentCount > totalCapacity) {
         return res.status(400).json({ 
           message: "Shortage of examination seats detected for this academic group.",
           capacityError: true,
           studentCount,
           totalCapacity,
           shortage: studentCount - totalCapacity,
           college_id,
           program_id,
           semester_id
         });
       }
    }

    // Handle Batch Creation if 'subjects' array is provided
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      const createdExams = [];
      for (const sub of subjects) {
        const { subject_id, exam_date, start_time, end_time } = sub;
        
        const isGlobalExternal = (exam_type == 2 && role === 'admin' && !college_id);
        
        // Skip marks structure validation for global external exams
        if (!isGlobalExternal) {
          const structureCheck = await client.query(
            `SELECT 1 FROM internal_marks_structure 
             WHERE college_id = $1 AND department_id = $2 AND program_id = $3 AND subject_id = $4 LIMIT 1`,
            [college_id, department_id, program_id, subject_id]
          );
          if (structureCheck.rows.length === 0) continue; // Skip subjects without structure in batch mode
        }

        const result = await client.query(
          `INSERT INTO exams (
            name, semester_id, college_id, university_id, exam_type, exam_date, start_time, end_time, 
            status, department_id, program_id, academic_year_id, subject_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [name, semester_id, college_id, university_id || null, exam_type, exam_date, start_time, end_time, status ?? true, department_id || null, program_id || null, academic_year_id || null, subject_id]
        );
        createdExams.push(result.rows[0]);
      }
      return res.status(201).json(createdExams[0]); // Return the first one or a summary
    }

    // Single Creation Logic (Fallback)
    const isGlobalExternal = (exam_type == 2 && role === 'admin' && !college_id);

    if (!name || !semester_id || (!college_id && !isGlobalExternal) || !exam_type || !exam_date || !subject_id || !department_id || !program_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await client.query(
      "INSERT INTO exams (name, semester_id, college_id, university_id, exam_type, exam_date, start_time, end_time, status, department_id, program_id, academic_year_id, subject_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [name, semester_id, college_id, university_id || null, exam_type, exam_date, start_time, end_time, status ?? true, department_id || null, program_id || null, academic_year_id || null, subject_id || null]
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
    const { role, college_id: userCollegeId, department_id: userDepartmentId } = req.user;
    let { name, semester_id, college_id, university_id, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id, start_time, end_time, subjects } = req.body;
    
    // Check if exists
    const checkResult = await client.query('SELECT name, semester_id, college_id, exam_type, program_id, academic_year_id, department_id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });
    const original = checkResult.rows[0];

    // Normalize empty string to null (university-wide exam)
    college_id = college_id === '' ? null : college_id;

    // Enforce constraints for restricted roles
    if (role === 'college_admin') {
      if (original.college_id != userCollegeId) {
        return res.status(403).json({ message: "Unauthorized to update this exam" });
      }
      college_id = userCollegeId;
    } else if (role === 'HOD') {
      if (original.college_id != userCollegeId || original.department_id != userDepartmentId) {
        return res.status(403).json({ message: "Unauthorized to update this exam" });
      }
      college_id = userCollegeId;
      department_id = userDepartmentId;
    }

    // --- Capacity Validation Logic (Same as creation) ---
    if (college_id && program_id && semester_id) {
       const studentCountRes = await client.query(
         `SELECT COUNT(*) FROM students 
          WHERE "collageName" = (SELECT name FROM colleges WHERE id = $1)
          AND "programName" = (SELECT name FROM master_programs WHERE id = $2)
          AND semister = (SELECT semester_name FROM master_semesters WHERE id = $3)
          AND "deleteStatus" = true`,
         [college_id, program_id, semester_id]
       );
       const studentCount = parseInt(studentCountRes.rows[0].count);

       const capacityRes = await client.query(
         `SELECT SUM(rows * seats_per_row) as total_capacity 
          FROM examination_halls 
          WHERE college_id = $1 AND status = 'Approved'`,
         [college_id]
       );
       const totalCapacity = parseInt(capacityRes.rows[0].total_capacity) || 0;

       if (studentCount > totalCapacity) {
         return res.status(400).json({ 
           message: "Shortage of examination seats detected for this academic group.",
           capacityError: true,
           studentCount,
           totalCapacity,
           shortage: studentCount - totalCapacity,
           college_id,
           program_id,
           semester_id
         });
       }
    }

    // Handle Batch Sync if 'subjects' array is provided
    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      // 1. Identify all IDs currently in this series
      const seriesRes = await client.query(
        `SELECT id FROM exams 
         WHERE name = $1 AND semester_id = $2 AND COALESCE(college_id, 0) = COALESCE($3, 0) 
         AND exam_type = $4 AND program_id = $5 AND academic_year_id = $6`,
        [original.name, original.semester_id, original.college_id, original.exam_type, original.program_id, original.academic_year_id]
      );
      const existingSeriesIds = seriesRes.rows.map(r => r.id);
      const incomingIds = subjects.map(s => s.id).filter(id => typeof id === 'number');

      // 2. Delete missing records
      const toDelete = existingSeriesIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await client.query("DELETE FROM exams WHERE id = ANY($1)", [toDelete]);
      }

      // 3. Update or Insert
      for (const sub of subjects) {
        const { id: subId, subject_id, exam_date, start_time, end_time } = sub;
        
        if (subId && typeof subId === 'number' && existingSeriesIds.includes(subId)) {
          // Update existing
          await client.query(
            `UPDATE exams SET 
              name = COALESCE($1, name), 
              semester_id = COALESCE($2, semester_id), 
              college_id = $3, 
              university_id = COALESCE($4, university_id),
              exam_type = COALESCE($5, exam_type), 
              exam_date = COALESCE($6, exam_date), 
              status = COALESCE($7, status),
              department_id = COALESCE($8, department_id),
              program_id = COALESCE($9, program_id),
              academic_year_id = COALESCE($10, academic_year_id),
              subject_id = COALESCE($11, subject_id),
              start_time = COALESCE($12, start_time),
              end_time = COALESCE($13, end_time),
              updated_at = CURRENT_TIMESTAMP
             WHERE id = $14`,
            [name, semester_id, college_id, university_id || null, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id, start_time, end_time, subId]
          );
        } else {
          // Insert new (Added to existing series during edit)
          await client.query(
            `INSERT INTO exams (
              name, semester_id, college_id, university_id, exam_type, exam_date, start_time, end_time, 
              status, department_id, program_id, academic_year_id, subject_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [name, semester_id, college_id, university_id || null, exam_type, exam_date, start_time, end_time, status ?? true, department_id || null, program_id || null, academic_year_id || null, subject_id]
          );
        }
      }
      return res.json({ message: "Series updated successfully", count: subjects.length });
    }

    const result = await client.query(
      `UPDATE exams 
       SET name = COALESCE($1, name), 
           semester_id = COALESCE($2, semester_id), 
           college_id = $3, 
           university_id = $4,
           exam_type = COALESCE($5, exam_type), 
           exam_date = COALESCE($6, exam_date), 
           status = COALESCE($7, status),
           department_id = COALESCE($8, department_id),
           program_id = COALESCE($9, program_id),
           academic_year_id = COALESCE($10, academic_year_id),
           subject_id = COALESCE($11, subject_id),
           start_time = COALESCE($12, start_time),
           end_time = COALESCE($13, end_time)
       WHERE id = $14 RETURNING *`,
      [name, semester_id, college_id || null, university_id || null, exam_type, exam_date, status, department_id, program_id, academic_year_id, subject_id, start_time, end_time, id]
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
    const { role, college_id: userCollegeId, department_id: userDepartmentId } = req.user;

    const checkResult = await client.query('SELECT college_id, department_id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    // Enforce security for restricted roles
    if (role === 'college_admin') {
      if (checkResult.rows[0].college_id != userCollegeId) {
        return res.status(403).json({ message: "Unauthorized to delete this exam" });
      }
    } else if (role === 'HOD') {
      if (checkResult.rows[0].college_id != userCollegeId || checkResult.rows[0].department_id != userDepartmentId) {
        return res.status(403).json({ message: "Unauthorized to delete this exam" });
      }
    }

    await client.query("DELETE FROM exams WHERE id = $1", [id]);
    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const publishExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;
    const { role, college_id: userCollegeId, department_id: userDepartmentId } = req.user;

    const checkResult = await client.query('SELECT college_id, department_id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    if (role === 'college_admin' && checkResult.rows[0].college_id != userCollegeId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (role === 'HOD' && (checkResult.rows[0].college_id != userCollegeId || checkResult.rows[0].department_id != userDepartmentId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await client.query(
      "UPDATE exams SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [is_published, id]
    );
    res.json({ message: `Exam ${is_published ? 'published' : 'unpublished'} successfully`, data: result.rows[0] });
  } catch (error) {
    console.error("Publish exam error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleStudentApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { open } = req.body;
    const { role, college_id: userCollegeId } = req.user;

    const checkResult = await client.query('SELECT college_id, is_published FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    if (!checkResult.rows[0].is_published && open) {
      return res.status(400).json({ message: "Cannot open applications for an unpublished exam" });
    }

    const result = await client.query(
      "UPDATE exams SET student_application_open = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [open, id]
    );
    res.json({ message: `Applications ${open ? 'opened' : 'closed'} successfully`, data: result.rows[0] });
  } catch (error) {
    console.error("Toggle application error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const publishResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results_published } = req.body;
    const { role, college_id: userCollegeId } = req.user;

    const checkResult = await client.query('SELECT college_id FROM exams WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    if (role === 'college_admin' && checkResult.rows[0].college_id != userCollegeId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await client.query(
      "UPDATE exams SET results_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [results_published, id]
    );
    res.json({ message: `Results ${results_published ? 'published' : 'unpublished'} successfully`, data: result.rows[0] });
  } catch (error) {
    console.error("Publish results error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find student record for this user
    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const studentId = studentRes.rows[0].id;

    // Fetch finalized marks for exams where results are published
    const query = `
      SELECT 
        m.id as mark_id,
        COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks,
        COALESCE(m.external_marks, 0) as external_marks,
        (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
        m.status as result_status,
        e.name as exam_name,
        e.id as exam_id,
        sub.name as subject_name,
        sub.id as subject_id,
        sub.subject_code,
        sub.credit as credits,
        mp.name as program_name,
        sem.semester_name,
        s."collageName" as college_name
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN master_subjects sub ON m.subject_id = sub.id
      JOIN master_programs mp ON e.program_id = mp.id
      JOIN master_semesters sem ON e.semester_id = sem.id
      JOIN students s ON m.student_id = s.id
      LEFT JOIN calculated_internal_marks cim ON m.student_id = cim.student_id 
          AND (cim.subject_id = m.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
      LEFT JOIN (
          SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
          FROM student_internal_marks
          GROUP BY student_id, subject_id
      ) raw_internal ON m.student_id = raw_internal.student_id AND m.subject_id = raw_internal.subject_id
      WHERE m.student_id = $1 AND e.results_published = true AND (m.status IN ('Finalized', 'Approved', 'Pending Approval', 'Draft', 'Internal Only'))
      ORDER BY e.exam_date DESC, sub.name ASC
    `;

    const result = await client.query(query, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student results error:", error);
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
  const dbClient = await client.connect();
  try {
    // Expected body: { subject_id, exam_id, academic_year_id, marksData: [{ student_id, internal_marks, external_marks, status }] }
    const { subject_id, exam_id, academic_year_id, marksData } = req.body;
    const teacher_id = req.user.id; // From verifyToken middleware
    
    // Attempt to lookup the real teacher record ID
    const teacherCheck = await dbClient.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    const actual_teacher_id = teacherCheck.rows.length > 0 ? teacherCheck.rows[0].id : null;

    if (!subject_id || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid payload format." });
    }

    await dbClient.query("BEGIN"); // Start transaction

    for (const record of marksData) {
      if (!record.student_id) continue;

      const internal = record.internal_marks !== undefined && record.internal_marks !== '' ? parseFloat(record.internal_marks) : null;
      const external = record.external_marks !== undefined && record.external_marks !== '' ? parseFloat(record.external_marks) : null;
      const computedTotal = (internal || 0) + (external || 0);
      const rowStatus = record.status || 'Draft';

      const checkResult = await dbClient.query(
        `SELECT id FROM marks 
         WHERE student_id = $1 AND subject_id = $2 
         AND (exam_id = $3 OR ($3 IS NULL AND exam_id IS NULL))
         AND (academic_year_id = $4 OR ($4 IS NULL AND academic_year_id IS NULL))`,
        [record.student_id, subject_id, exam_id || null, academic_year_id || null]
      );

      if (checkResult.rows.length > 0) {
        await dbClient.query(
          `UPDATE marks 
           SET internal_marks = $1, external_marks = $2, total_marks = $3, status = $4, teacher_id = $5 
           WHERE id = $6 AND status != 'Approved'`,
          [internal, external, computedTotal, rowStatus, actual_teacher_id, checkResult.rows[0].id]
        );
      } else {
        await dbClient.query(
          `INSERT INTO marks (student_id, subject_id, exam_id, academic_year_id, internal_marks, external_marks, total_marks, status, teacher_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [record.student_id, subject_id, exam_id || null, academic_year_id || null, internal, external, computedTotal, rowStatus, actual_teacher_id]
        );
      }
    }

    await dbClient.query("COMMIT");
    res.json({ message: "Marks saved successfully." });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("Save teacher marks error:", error);
    res.status(500).json({ message: "Failed to save marks", error: error.message });
  } finally {
    dbClient.release();
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
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = `SELECT s.id, s.semester_name, s.status, s.created_at 
                 FROM master_semesters s`;
    const params = [];

    if (uId) {
      query += ` JOIN university_master_semesters ums ON s.id = ums.semester_id WHERE ums.university_id = $1 AND (s.status = 'Active' OR s.status IS NULL)`;
      params.push(uId);
    } else {
      query += ` WHERE (s.status = 'Active' OR s.status IS NULL)`;
    }

    query += ` ORDER BY s.id ASC`;
    const result = await client.query(query, params);
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
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = `SELECT ms.id, ms.subject_code, ms.name, ms.status, ms.created_at, 
               ms.program_id, ms.semester_id, ms.mapping_type, ms.is_mandatory, 
               ms.has_examination, ms.periods_per_week, ms.teacher_id, ms.credit, ms.university_id,
               mp.name AS program_name,
               mse.semester_name,
               u.name AS teacher_name,
               COALESCE(
                 (SELECT json_agg(department_id) 
                  FROM master_subject_departments 
                  WHERE subject_id = ms.id), 
               '[]'::json) as department_ids
        FROM master_subjects ms 
        LEFT JOIN master_programs mp ON ms.program_id = mp.id
        LEFT JOIN master_semesters mse ON ms.semester_id = mse.id
        LEFT JOIN master_teachers mt ON ms.teacher_id = mt.id
        LEFT JOIN users u ON mt.user_id = u.id
        WHERE (ms.status IS NULL OR ms.status = 'Active')`;
    const params = [];

    if (uId) {
      query += " AND ms.university_id = $1";
      params.push(uId);
    }

    query += " ORDER BY ms.id";
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get master subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterSubject = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const {
      subject_code, name, department_ids,
      program_id, semester_id, mapping_type, is_mandatory,
      has_examination, periods_per_week, teacher_id
    } = req.body;

    if (!subject_code || !name) return res.status(400).json({ message: "Subject code and name are required" });

    let credit = 4;
    if (['Major 1', 'Major 2', 'Major', 'Minor', 'Elective'].includes(mapping_type)) {
      credit = 6;
    } else if (['Vocational', 'FC-1', 'FC-2', 'FP/Int/Appr', 'AEC', 'SEC', 'VBC'].includes(mapping_type)) {
      credit = 4;
    }

    const { university_id } = req.user || {};
    await dbClient.query('BEGIN');
    const result = await dbClient.query(
      `INSERT INTO master_subjects (
        subject_code, name, program_id, semester_id, mapping_type, 
        is_mandatory, has_examination, periods_per_week, teacher_id, status, credit, university_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', $10, $11) 
      RETURNING *`,
      [subject_code, name, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, teacher_id, credit, university_id]
    );
    const subjectId = result.rows[0].id;
    if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
      for (const deptId of department_ids) {
        await dbClient.query("INSERT INTO master_subject_departments (subject_id, department_id) VALUES ($1, $2)", [subjectId, deptId]);
      }
    }
    await dbClient.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Create master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    dbClient.release();
  }
};

const getMasterSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `SELECT id, subject_code, name, status, created_at,
              program_id, semester_id, mapping_type, is_mandatory, 
              has_examination, periods_per_week, teacher_id, credit
       FROM master_subjects 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Master subject not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterSubject = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { id } = req.params;
    const {
      subject_code, name, department_ids,
      program_id, semester_id, mapping_type, is_mandatory,
      has_examination, periods_per_week, teacher_id
    } = req.body;

    if (!subject_code || !name) return res.status(400).json({ message: "Subject code and name are required" });

    let credit = 4;
    if (['Major 1', 'Major 2', 'Major', 'Minor', 'Elective'].includes(mapping_type)) {
      credit = 6;
    } else if (['Vocational', 'FC-1', 'FC-2', 'FP/Int/Appr', 'AEC', 'SEC', 'VBC'].includes(mapping_type)) {
      credit = 4;
    }

    const { role, university_id } = req.user || {};
    await dbClient.query('BEGIN');

    let updateQuery = `UPDATE master_subjects 
                       SET subject_code = $1, name = $2, program_id = $3, semester_id = $4, 
                           mapping_type = $5, is_mandatory = $6, has_examination = $7, 
                           periods_per_week = $8, teacher_id = $9, credit = $10, updated_at = CURRENT_TIMESTAMP`;
    let queryParams = [subject_code, name, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, teacher_id, credit, id];
    
    if (role === 'university_admin' && university_id) {
      updateQuery += ` WHERE id = $11 AND university_id = $12 RETURNING *`;
      queryParams.push(university_id);
    } else {
      updateQuery += ` WHERE id = $11 RETURNING *`;
    }

    const result = await dbClient.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: "Master subject not found" });
    }

    if (department_ids && Array.isArray(department_ids)) {
      await dbClient.query("DELETE FROM master_subject_departments WHERE subject_id = $1", [id]);
      for (const deptId of department_ids) {
        await dbClient.query("INSERT INTO master_subject_departments (subject_id, department_id) VALUES ($1, $2)", [id, deptId]);
      }
    }
    await dbClient.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Update master subject error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    dbClient.release();
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
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = `SELECT p.id, p.name, p.status, p.created_at 
                 FROM master_programs p`;
    const params = [];

    if (role === 'university_admin') {
      if (!university_id) return res.json([]);
      query += ` JOIN university_master_programs ump ON p.id = ump.program_id WHERE ump.university_id = $1 AND (p.status = 'Active' OR p.status IS NULL)`;
      params.push(university_id);
    } else if (uId) {
      query += ` JOIN university_master_programs ump ON p.id = ump.program_id WHERE ump.university_id = $1 AND (p.status = 'Active' OR p.status IS NULL)`;
      params.push(uId);
    } else {
      query += ` WHERE (p.status = 'Active' OR p.status IS NULL)`;
    }

    query += ` ORDER BY p.id ASC`;
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get master programs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterProgram = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { role, university_id: userUniId } = req.user || {};
    const { name, duration_years, department_ids, section_name, code, grading_system_type, enable_elective_subjects_selection, university_id } = req.body;
    
    // For university_admin, override university_id from body with their own
    const targetUniId = role === 'university_admin' ? userUniId : university_id;

    if (!name || !duration_years) return res.status(400).json({ message: "Program name and duration are required" });
    await dbClient.query('BEGIN');
    const result = await dbClient.query(
      "INSERT INTO master_programs (name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, status, university_id) VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7) RETURNING id, name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, status, created_at, university_id",
      [name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, targetUniId]
    );
    const programId = result.rows[0].id;
    if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
      for (const deptId of department_ids) {
        await dbClient.query("INSERT INTO master_program_departments (program_id, department_id) VALUES ($1, $2)", [programId, deptId]);
      }
    }
    await dbClient.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Create master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    dbClient.release();
  }
};

const getMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, university_id } = req.user || {};
    let query = "SELECT id, name, duration_years, status, created_at, university_id FROM master_programs WHERE id = $1";
    const params = [id];

    const result = await client.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ message: "Master program not found" });
    
    const program = result.rows[0];
    if (role === 'university_admin' && university_id && program.university_id !== university_id) {
        return res.status(403).json({ message: "Access denied to this university's program" });
    }
    
    res.json(program);
  } catch (error) {
    console.error("Get master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterProgram = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { id } = req.params;
    const { role, university_id: userUniId } = req.user || {};
    const { name, duration_years, department_ids, section_name, code, grading_system_type, enable_elective_subjects_selection } = req.body;
    
    if (!name || !duration_years) return res.status(400).json({ message: "Program name and duration are required" });

    // Check ownership
    const checkRes = await dbClient.query("SELECT university_id FROM master_programs WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      dbClient.release();
      return res.status(404).json({ message: "Master program not found" });
    }
    if (role === 'university_admin' && userUniId && checkRes.rows[0].university_id !== userUniId) {
      dbClient.release();
      return res.status(403).json({ message: "Access denied to this university's program" });
    }

    await dbClient.query('BEGIN');
    const result = await dbClient.query(
      "UPDATE master_programs SET name = $1, duration_years = $2, section_name = $3, code = $4, grading_system_type = $5, enable_elective_subjects_selection = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, created_at, university_id",
      [name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, id]
    );
    if (department_ids && Array.isArray(department_ids)) {
      await dbClient.query("DELETE FROM master_program_departments WHERE program_id = $1", [id]);
      for (const deptId of department_ids) {
        await dbClient.query("INSERT INTO master_program_departments (program_id, department_id) VALUES ($1, $2)", [id, deptId]);
      }
    }
    await dbClient.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Update master program error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    dbClient.release();
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

const getMasterBatches = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT mb.*, mp.name as program_name 
       FROM master_batches mb
       LEFT JOIN master_programs mp ON mb.program_id = mp.id
       WHERE mb.status = 'Active' OR mb.status IS NULL
       ORDER BY mb.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master batches error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createMasterBatch = async (req, res) => {
  try {
    const { batch_name, start_date, end_date, academic_year, import_fees_flag, program_id } = req.body;
    if (!batch_name) return res.status(400).json({ message: "Batch name is required" });

    const result = await client.query(
      `INSERT INTO master_batches (batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active')
       RETURNING *`,
      [batch_name, start_date, end_date, academic_year, import_fees_flag, program_id]
    );
    res.status(201).json({ message: "Batch created successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Create master batch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateMasterBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_name, start_date, end_date, academic_year, import_fees_flag, program_id } = req.body;

    const result = await client.query(
      `UPDATE master_batches 
       SET batch_name = $1, start_date = $2, end_date = $3, academic_year = $4, 
           import_fees_flag = $5, program_id = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Update master batch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteMasterBatch = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete
    const result = await client.query(
      `UPDATE master_batches SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Batch not found" });
    res.json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Delete master batch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSubjectMappings = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        msm.*,
        mp.name AS program_name,
        mse.semester_name,
        ms.name AS subject_name,
        ms.subject_code,
        mt.name AS teacher_name,
        mt.employee_code AS teacher_employee_number
      FROM master_subject_mappings msm
      LEFT JOIN master_programs mp ON msm.program_id = mp.id
      LEFT JOIN master_semesters mse ON msm.semester_id = mse.id
      LEFT JOIN master_subjects ms ON msm.subject_id = ms.id
      LEFT JOIN master_teachers mt ON msm.teacher_id = mt.id
      WHERE msm.status = 'Active'
      ORDER BY msm.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get subject mappings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createSubjectMapping = async (req, res) => {
  try {
    const {
      program_id, semester_id, subject_id, teacher_id,
      mapping_type, is_mandatory, has_examination, periods_per_week
    } = req.body;

    if (!program_id || !semester_id || !subject_id) {
      return res.status(400).json({ message: "Program, Semester, and Subject are required" });
    }

    const result = await client.query(
      `INSERT INTO master_subject_mappings (
        program_id, semester_id, subject_id, teacher_id, 
        mapping_type, is_mandatory, has_examination, periods_per_week, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active')
      RETURNING *`,
      [program_id, semester_id, subject_id, teacher_id, mapping_type, is_mandatory, has_examination, periods_per_week]
    );
    res.status(201).json({ message: "Subject mapping created successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Create subject mapping error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateSubjectMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      program_id, semester_id, subject_id, teacher_id,
      mapping_type, is_mandatory, has_examination, periods_per_week
    } = req.body;

    const result = await client.query(
      `UPDATE master_subject_mappings 
       SET program_id = $1, semester_id = $2, subject_id = $3, teacher_id = $4, 
           mapping_type = $5, is_mandatory = $6, has_examination = $7, 
           periods_per_week = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [program_id, semester_id, subject_id, teacher_id, mapping_type, is_mandatory, has_examination, periods_per_week, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Mapping not found" });
    res.json({ message: "Subject mapping updated successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Update subject mapping error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteSubjectMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `UPDATE master_subject_mappings SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Mapping not found" });
    res.json({ message: "Subject mapping deleted successfully" });
  } catch (error) {
    console.error("Delete subject mapping error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterPolicies = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);

    let query = "SELECT id, name, description, status, created_at FROM master_policies";
    const params = [];

    if (uId) {
      query = `SELECT p.id, p.name, p.description, p.status, p.created_at 
               FROM master_policies p 
               JOIN university_master_policies ump ON p.id = ump.policy_id 
               WHERE ump.university_id = $1`;
      params.push(uId);
    }

    query += " ORDER BY id";
    const result = await client.query(query, params);
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
    const { role: roleName, college_id: collegeId, department_id: departmentId } = req.user;
    let query = `SELECT 
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
      WHERE mt.status = 'Active'`;

    const params = [];
    if (roleName === 'HOD') {
      params.push(collegeId, departmentId);
      query += ` AND mt.college_id = $1 AND mt.department_id = $2`;
    } else if (roleName === 'college_admin') {
      params.push(collegeId);
      query += ` AND mt.college_id = $1`;
    } else if (roleName === 'university_admin') {
      const universityId = req.user?.university_id || req.user?.universityId;
      params.push(universityId);
      query += ` AND c.university_id = $1`;
    }

    query += ` ORDER BY mt.id DESC`;

    const result = await client.query(query, params);
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
  let {
    name, email, college_id, department_id, designation_id, employee_code, experience, qualification, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status,
    employee_category_name, first_name, middle_name, last_name, job_title, employee_position_name, employee_department_name, employee_grade_name, experience_detail, experience_months, marital_status, father_name, mother_name, spouse_name, blood_group, country_name, home_address_line1, home_city, home_state, home_country_name, office_phone1, office_phone2, office_state, home_phone1, fax
  } = req.body;

  const { roleName, collegeId, departmentId: userDeptId } = req.user;

  // Enforce HOD restrictions
  if (roleName === 'HOD') {
    college_id = collegeId;
    department_id = userDeptId;
  } else if (roleName === 'college_admin') {
    college_id = collegeId;
  }

  const dbClient = await client.connect();
  try {
    // Validate required fields
    if (!name || !email || !college_id || !department_id || !designation_id) {
      return res.status(400).json({ success: false, message: "Name, email, college, department, and designation are required" });
    }

    // Check if email already exists
    const existingEmail = await dbClient.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Generate employee code if not provided
    const finalEmployeeCode = employee_code || `EMP-${Date.now()}`;

    // Check if employee code already exists
    const existingCode = await dbClient.query(
      "SELECT id FROM master_teachers WHERE employee_code = $1",
      [finalEmployeeCode]
    );

    if (existingCode.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Employee code already exists" });
    }

    // Begin transaction
    await dbClient.query('BEGIN');

    // Create user
    const userResult = await dbClient.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
      [name, email]
    );
    const userId = userResult.rows[0].id;

    // Create master teacher
    const result = await dbClient.query(
      `INSERT INTO master_teachers (
        user_id, employee_code, college_id, department_id, designation_id, qualification, experience_years, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status,
        employee_category_name, first_name, middle_name, last_name, job_title, employee_position_name, employee_department_name, employee_grade_name, experience_detail, experience_months, marital_status, father_name, mother_name, spouse_name, blood_group, country_name, home_address_line1, home_city, home_state, home_country_name, office_phone1, office_phone2, office_state, home_phone1, email, fax
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
       RETURNING id`,
      [
        userId, finalEmployeeCode, college_id, department_id, designation_id, qualification || null, experience || 0, specialization || null, pan_no || null, aadhaar_no || null, dob || null, gender || null, joining_date || null, phone || null, address || null, status || 'Active',
        employee_category_name || null, first_name || null, middle_name || null, last_name || null, job_title || null, employee_position_name || null, employee_department_name || null, employee_grade_name || null, experience_detail || null, experience_months || null, marital_status || null, father_name || null, mother_name || null, spouse_name || null, blood_group || null, country_name || null, home_address_line1 || null, home_city || null, home_state || null, home_country_name || null, office_phone1 || null, office_phone2 || null, office_state || null, home_phone1 || null, email || null, fax || null
      ]
    );

    const teacherId = result.rows[0].id;

    // Fetch the complete record with all joins for display
    const completeRecord = await dbClient.query(
      `SELECT 
        mt.id,
        u.name,
        mt.email,
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
        mt.designation_id,
        mt.employee_category_name, mt.first_name, mt.middle_name, mt.last_name, mt.job_title, mt.employee_position_name, mt.employee_department_name, mt.employee_grade_name, mt.experience_detail, mt.experience_months, mt.marital_status, mt.father_name, mt.mother_name, mt.spouse_name, mt.blood_group, mt.country_name, mt.home_address_line1, mt.home_city, mt.home_state, mt.home_country_name, mt.office_phone1, mt.office_phone2, mt.office_state, mt.home_phone1, mt.fax
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      LEFT JOIN colleges c ON mt.college_id = c.id
      LEFT JOIN master_departments md ON mt.department_id = md.id
      LEFT JOIN master_designations mdes ON mt.designation_id = mdes.id
      WHERE mt.id = $1`,
      [teacherId]
    );

    await dbClient.query('COMMIT');
    res.status(201).json({
      success: true,
      message: "Teacher record created successfully",
      data: completeRecord.rows[0]
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Create master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  } finally {
    dbClient.release();
  }
};

const updateMasterTeacher = async (req, res) => {
  const { id } = req.params;
  const { roleName, collegeId, departmentId: userDeptId } = req.user;

  let {
    name, email, college_id, department_id, designation_id, qualification, experience, specialization, pan_no, aadhaar_no, dob, gender, joining_date, phone, address, status,
    employee_category_name, first_name, middle_name, last_name, job_title, employee_position_name, employee_department_name, employee_grade_name, experience_detail, experience_months, marital_status, father_name, mother_name, spouse_name, blood_group, country_name, home_address_line1, home_city, home_state, home_country_name, office_phone1, office_phone2, office_state, home_phone1, fax
  } = req.body;

  // Enforce HOD restrictions
  if (roleName === 'HOD') {
    college_id = collegeId;
    department_id = userDeptId;
  } else if (roleName === 'college_admin') {
    college_id = collegeId;
  }

  const dbClient = await client.connect();
  try {
    // Get existing teacher and check permissions
    let checkQuery = "SELECT user_id, college_id, department_id FROM master_teachers WHERE id = $1";
    const existing = await dbClient.query(checkQuery, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Master teacher not found" });
    }

    // Permission check
    if (roleName === 'HOD') {
      if (existing.rows[0].college_id !== collegeId || existing.rows[0].department_id !== userDeptId) {
        return res.status(403).json({ success: false, message: "Access denied. You can only update teachers in your department." });
      }
    } else if (roleName === 'college_admin') {
      if (existing.rows[0].college_id !== collegeId) {
        return res.status(403).json({ success: false, message: "Access denied. You can only update teachers in your college." });
      }
    }

    const userId = existing.rows[0].user_id;

    // Begin transaction
    await dbClient.query('BEGIN');

    // Update user if name or email provided
    if (name || email) {
      await dbClient.query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3`,
        [name || null, email || null, userId]
      );
    }

    // Update master teacher
    await dbClient.query(
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
           employee_category_name = COALESCE($16, employee_category_name),
           first_name = COALESCE($17, first_name),
           middle_name = COALESCE($18, middle_name),
           last_name = COALESCE($19, last_name),
           job_title = COALESCE($20, job_title),
           employee_position_name = COALESCE($21, employee_position_name),
           employee_department_name = COALESCE($22, employee_department_name),
           employee_grade_name = COALESCE($23, employee_grade_name),
           experience_detail = COALESCE($24, experience_detail),
           experience_months = COALESCE($25, experience_months),
           marital_status = COALESCE($26, marital_status),
           father_name = COALESCE($27, father_name),
           mother_name = COALESCE($28, mother_name),
           spouse_name = COALESCE($29, spouse_name),
           blood_group = COALESCE($30, blood_group),
           country_name = COALESCE($31, country_name),
           home_address_line1 = COALESCE($32, home_address_line1),
           home_city = COALESCE($33, home_city),
           home_state = COALESCE($34, home_state),
           home_country_name = COALESCE($35, home_country_name),
           office_phone1 = COALESCE($36, office_phone1),
           office_phone2 = COALESCE($37, office_phone2),
           office_state = COALESCE($38, office_state),
           home_phone1 = COALESCE($39, home_phone1),
           email = COALESCE($40, email),
           fax = COALESCE($41, fax),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [
        id,
        college_id || null, department_id || null, designation_id || null, qualification || null, experience || null, specialization || null, pan_no || null, aadhaar_no || null, dob || null, gender || null, joining_date || null, phone || null, address || null, status || null,
        employee_category_name || null, first_name || null, middle_name || null, last_name || null, job_title || null, employee_position_name || null, employee_department_name || null, employee_grade_name || null, experience_detail || null, experience_months || null, marital_status || null, father_name || null, mother_name || null, spouse_name || null, blood_group || null, country_name || null, home_address_line1 || null, home_city || null, home_state || null, home_country_name || null, office_phone1 || null, office_phone2 || null, office_state || null, home_phone1 || null, email || null, fax || null
      ]
    );

    // Fetch the complete updated record with all joins
    const result = await dbClient.query(
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

    await dbClient.query('COMMIT');
    res.json({
      success: true,
      message: "Teacher record updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Update master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  } finally {
    dbClient.release();
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

const getMasterAcademicYears = async (req, res) => {
  try {
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = `SELECT y.id, y.academic_year, y.status, y.created_at 
                 FROM master_academic_years y`;
    const params = [];

    if (uId) {
      query += ` JOIN university_master_academic_years umy ON y.id = umy.academic_year_id WHERE umy.university_id = $1 AND (y.status = 'Active' OR y.status IS NULL)`;
      params.push(uId);
    } else {
      query += ` WHERE (y.status = 'Active' OR y.status IS NULL)`;
    }

    query += ` ORDER BY y.id ASC`;
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get master academic years error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMasterDepartments = async (req, res) => {
  try {
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);
    
    let query = `SELECT md.id, md.department_name, md.department_code, md.college_id, md.status
                 FROM master_departments md
                 JOIN colleges c ON md.college_id = c.id
                 WHERE (md.status = 'Active' OR md.status IS NULL)`;
    const params = [];

    if (uId) {
      query += " AND c.university_id = $1";
      params.push(uId);
    }

    query += " ORDER BY md.id ASC";
    const result = await client.query(query, params);
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

const getStudentExams = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First, find the student details associated with this user
    const studentRes = await client.query(
      `SELECT id, "programName", semister, "collageName" 
       FROM students 
       WHERE user_id = $1 AND "deleteStatus" = true`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found for this user." });
    }

    const student = studentRes.rows[0];

    // Fetch exams matching the student's program, semester, and college
    // Note: students table stores these as strings, exams table stores them as IDs.
    // We need to resolve Name/Semester/College to IDs or join accurately.
    // Based on existing getExams logic, we filter by published and application open status.
    
    // Improved query to handle string-based student fields
    const query = `
      SELECT 
        e.id, 
        e.name as exam_name, 
        e.semester_id,
        ms.semester_name,
        COALESCE(c.name, 'University-wide') as college_name,
        et.type_name as exam_type_name,
        sub.name as subject_name,
        e.exam_date, 
        e.start_time,
        e.end_time,
        er.payment_status,
        er.registration_date
      FROM exams e
      JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      JOIN exam_types et ON e.exam_type = et.id
      JOIN master_subjects sub ON e.subject_id = sub.id
      JOIN master_programs mp ON e.program_id = mp.id
      LEFT JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = $1
      WHERE e.is_published = true 
        AND e.student_application_open = true
        AND mp.name = $2
        AND ms.semester_name = $3
        AND (c.name = $4 OR (e.college_id IS NULL AND e.exam_type = 2))
      ORDER BY e.exam_date ASC, e.start_time ASC
    `;

    const result = await client.query(query, [student.id, student.programName, student.semister, student.collageName]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student exams error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const registerForExam = async (req, res) => {
  try {
    const { exam_ids } = req.body; // Changed from exam_id to exam_ids (array)
    const userId = req.user.id;

    if (!exam_ids || !Array.isArray(exam_ids) || exam_ids.length === 0) {
      return res.status(400).json({ message: "Exam IDs are required." });
    }

    // Find student ID
    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found." });
    const studentId = studentRes.rows[0].id;

    // Bulk insert registration
    await client.query(
      `INSERT INTO exam_registrations (student_id, exam_id, payment_status, registration_date)
       SELECT $1, UNNEST($2::int[]), 'Paid', CURRENT_TIMESTAMP
       ON CONFLICT (student_id, exam_id) DO NOTHING`,
      [studentId, exam_ids]
    );

    res.json({ message: "Successfully registered for exam series." });
  } catch (error) {
    console.error("Register for exam error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getHallTicketData = async (req, res) => {
  try {
    const { examName, semesterId } = req.params;
    const userId = req.user.id;
    
    // 1. Get complete student details
    const studentRes = await client.query(
      `SELECT id, name, rollnumber, "programName", semister, "collageName", 
              "fatherName", email, "contactNumber", address, adharnumber,
              admission_no, batch, section, gender
       FROM students 
       WHERE user_id = $1 AND "deleteStatus" = true`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const student = studentRes.rows[0];

    // 2. Fetch registered exams for this specific series
    const query = `
      SELECT 
        e.id, 
        e.name as exam_name, 
        ms.semester_name,
        COALESCE(c.name, 'University-wide') as college_name,
        et.type_name as exam_type_name,
        sub.name as subject_name,
        sub.subject_code,
        e.exam_date, 
        e.start_time,
        e.end_time
      FROM exams e
      JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      JOIN exam_types et ON e.exam_type = et.id
      JOIN master_subjects sub ON e.subject_id = sub.id
      JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = $1
      WHERE e.name = $2 
        AND e.semester_id = $3
        AND er.payment_status = 'Paid'
      ORDER BY e.exam_date ASC, e.start_time ASC
    `;

    const examRes = await client.query(query, [student.id, examName, semesterId]);
    
    if (examRes.rows.length === 0) {
      return res.status(404).json({ message: "No paid registrations found for this exam series." });
    }

    res.json({
      student,
      exams: examRes.rows,
      university: "Madhya Pradesh University of Excellence", // Placeholder or fetch from config
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("Get hall ticket data error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getResultSheetData = async (req, res) => {
  try {
    const { examName } = req.params;
    const userId = req.user.id;
    
    // 1. Get student details
    const studentRes = await client.query(
      `SELECT id, name, rollnumber, "programName", semister, "collageName", 
              "fatherName", email, "contactNumber", address, adharnumber,
              admission_no, batch, section, gender
       FROM students 
       WHERE user_id = $1`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const student = studentRes.rows[0];

    // 2. Fetch marks for this specific exam name
    const query = `
      SELECT 
        m.id as mark_id,
        COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks,
        COALESCE(m.external_marks, 0) as external_marks,
        (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
        m.status as result_status,
        e.name as exam_name,
        e.id as exam_id,
        sub.name as subject_name,
        sub.subject_code,
        sub.credit as credits,
        mp.name as program_name,
        sem.semester_name,
        s."collageName" as college_name
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN master_subjects sub ON m.subject_id = sub.id
      JOIN master_programs mp ON e.program_id = mp.id
      JOIN master_semesters sem ON e.semester_id = sem.id
      JOIN students s ON m.student_id = s.id
      LEFT JOIN calculated_internal_marks cim ON m.student_id = cim.student_id 
          AND (cim.subject_id = m.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
      LEFT JOIN (
          SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
          FROM student_internal_marks
          GROUP BY student_id, subject_id
      ) raw_internal ON m.student_id = raw_internal.student_id AND m.subject_id = raw_internal.subject_id
      WHERE m.student_id = $1 AND e.name = $2 AND e.results_published = true AND (m.status IN ('Finalized', 'Approved', 'Pending Approval', 'Draft', 'Internal Only'))
      ORDER BY sub.name ASC
    `;

    const result = await client.query(query, [student.id, examName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No officially published results found for this exam series." });
    }

    res.json({
      student,
      results: result.rows,
      university: "Madhya Pradesh University of Excellence",
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("Get result sheet data error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await client.query('SELECT * FROM public.users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await client.query(
      'UPDATE public.users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [resetToken, resetTokenExpire, email]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.rows[0].email,
        subject: 'Password Reset Token',
        message
      });
      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      console.error(err);
      await client.query(
        'UPDATE public.users SET reset_password_token = NULL, reset_password_expires = NULL WHERE email = $1',
        [email]
      );
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    const user = await client.query(
      'SELECT * FROM public.users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [resetToken]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query(
      'UPDATE public.users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// University Admin Mapping Functions
const mapMasterProgram = async (req, res) => {
  try {
    const { program_id } = req.body;
    const { university_id } = req.user;
    await client.query(
      "INSERT INTO university_master_programs (university_id, program_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [university_id, program_id]
    );
    res.json({ message: "Program mapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error mapping program", error: error.message });
  }
};

const unmapMasterProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { university_id } = req.user;
    await client.query(
      "DELETE FROM university_master_programs WHERE university_id = $1 AND program_id = $2",
      [university_id, id]
    );
    res.json({ message: "Program unmapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unmapping program", error: error.message });
  }
};

const mapMasterSemester = async (req, res) => {
  try {
    const { semester_id } = req.body;
    const { university_id } = req.user;
    await client.query(
      "INSERT INTO university_master_semesters (university_id, semester_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [university_id, semester_id]
    );
    res.json({ message: "Semester mapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error mapping semester", error: error.message });
  }
};

const unmapMasterSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { university_id } = req.user;
    await client.query(
      "DELETE FROM university_master_semesters WHERE university_id = $1 AND semester_id = $2",
      [university_id, id]
    );
    res.json({ message: "Semester unmapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unmapping semester", error: error.message });
  }
};

const mapMasterAcademicYear = async (req, res) => {
  try {
    const { academic_year_id } = req.body;
    const { university_id } = req.user;
    await client.query(
      "INSERT INTO university_master_academic_years (university_id, academic_year_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [university_id, academic_year_id]
    );
    res.json({ message: "Academic year mapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error mapping academic year", error: error.message });
  }
};

const unmapMasterAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { university_id } = req.user;
    await client.query(
      "DELETE FROM university_master_academic_years WHERE university_id = $1 AND academic_year_id = $2",
      [university_id, id]
    );
    res.json({ message: "Academic year unmapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unmapping academic year", error: error.message });
  }
};

const mapMasterPolicy = async (req, res) => {
  try {
    const { policy_id } = req.body;
    const { university_id } = req.user;
    await client.query(
      "INSERT INTO university_master_policies (university_id, policy_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [university_id, policy_id]
    );
    res.json({ message: "Policy mapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error mapping policy", error: error.message });
  }
};

const unmapMasterPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { university_id } = req.user;
    await client.query(
      "DELETE FROM university_master_policies WHERE university_id = $1 AND policy_id = $2",
      [university_id, id]
    );
    res.json({ message: "Policy unmapped successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unmapping policy", error: error.message });
  }
};


module.exports = {
  register,
  changePassword,
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPrograms,
  getSubjects,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getSemesters,
  getExamTypes,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
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
  publishExam,
  toggleStudentApplication,
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
  // master batches
  getMasterBatches,
  createMasterBatch,
  updateMasterBatch,
  deleteMasterBatch,
  // mark module additions
  getStudentsForMarks,
  saveTeacherMarks,
  getMarksForApproval,
  approveRejectMarks,
  // Subject Mapping
  getSubjectMappings,
  createSubjectMapping,
  updateSubjectMapping,
  deleteSubjectMapping,
  getStudentExams,
  registerForExam,
  publishResults,
  getStudentResults,
  getHallTicketData,
  getResultSheetData,
  forgotPassword,
  resetPassword,
  mapMasterProgram,
  unmapMasterProgram,
  mapMasterSemester,
  unmapMasterSemester,
  mapMasterAcademicYear,
  unmapMasterAcademicYear,
  mapMasterPolicy,
  unmapMasterPolicy
};