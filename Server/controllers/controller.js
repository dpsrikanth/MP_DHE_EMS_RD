require("dotenv").config();
const logger = require('../utils/logger');
const express = require("express");
const bcrypt = require("bcryptjs");
const client = require('../config/db');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");// -- Phase 1: Student Account Activation (Self-Onboarding) --
const { applyGraceMarks } = require("../utils/graceUtils");

/**
 * Extracts the real client IP from a request.
 * Priority: X-Forwarded-For → X-Real-IP → socket.remoteAddress
 * Normalizes IPv6-mapped IPv4 (::ffff:x.x.x.x → x.x.x.x) and
 * IPv6 loopback (::1 → 127.0.0.1).
 */
const getClientIP = (req) => {
  // X-Forwarded-For can be a comma-separated list; the first entry is the client
  const forwarded = req.headers['x-forwarded-for'];
  const realIp    = req.headers['x-real-ip'];
  const raw = (forwarded ? forwarded.split(',')[0] : null)
    || realIp
    || req.socket?.remoteAddress
    || req.connection?.remoteAddress
    || 'Unknown';

  const ip = raw.trim();

  // Normalize ::ffff:x.x.x.x  →  x.x.x.x
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  // Normalize IPv6 loopback  →  127.0.0.1
  if (ip === '::1') return '127.0.0.1';
  return ip;
};

const initiateRegistration = async (req, res) => {
  try {
    const email = req.body.email?.trim();

    if (!email) {
      return res.status(400).json({ message: "Email is required to initiate activation" });
    }

    // Role-based security: Students MUST be pre-registered by Admin in Phase 1
    const studentProfile = await client.query(
      'SELECT id, name, "collageName" FROM public.students WHERE email ILIKE $1 AND "deleteStatus" = true',
      [email]
    );
    if (studentProfile.rows.length === 0) {
      return res.status(403).json({
        message: "This email is not pre-registered in our records. Please contact your college administrator."
      });
    }

    const { name, collageName } = studentProfile.rows[0];

    // Find College ID and its associated University ID
    let college_id = null;
    let university_id = null;

    if (collageName) {
      const collegeRes = await client.query('SELECT id, university_id FROM public.colleges WHERE name ILIKE $1', [collageName]);
      if (collegeRes.rows.length > 0) {
        college_id = collegeRes.rows[0].id;
        university_id = collegeRes.rows[0].university_id;
      }
    }

    // Existing user check (verified accounts only)
    const existingUser = await client.query(
      "SELECT id, is_verified, password_hash FROM public.users WHERE email ILIKE $1",
      [email]
    );

    if (existingUser.rows.length > 0 && existingUser.rows[0].is_verified && existingUser.rows[0].password_hash !== null) {
      return res.status(400).json({ message: "This account is already fully activated. Please proceed to login." });
    }

    // Generate Verification Credentials
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const roleResult = await client.query("SELECT id FROM public.roles WHERE role_name = 'Student'");
    if (roleResult.rows.length === 0) return res.status(400).json({ message: "Student role not found in system." });
    const roleId = roleResult.rows[0].id;

    // Phase 2: Create/Update unverified user
    let newUserId;
    if (existingUser.rows.length > 0) {
      const updateRes = await client.query(
        "UPDATE public.users SET name = $1, role_id = $2, otp = $3, otp_expiry = $4, is_verified = false WHERE email = $5 RETURNING id",
        [name, roleId, otp, otpExpiry, email]
      );
      newUserId = updateRes.rows[0].id;
    } else {
      const insertRes = await client.query(
        "INSERT INTO public.users (name, email, role_id, college_id, university_id, otp, otp_expiry, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING id",
        [name, email, roleId, college_id, university_id, otp, otpExpiry]
      );
      newUserId = insertRes.rows[0].id;
    }

    // Link the user_id back to the students table to ensure login and dashboard work
    await client.query(
      "UPDATE public.students SET user_id = $1 WHERE email ILIKE $2",
      [newUserId, email]
    );

    // Deliver Identity Proof (OTP)
    console.log(`\n\n========================================`);
    console.log(`🔐 STUDENT ACTIVATION OTP GENERATED`);
    console.log(`Email: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n\n`);

    try {
      await sendEmail({
        email: email,
        subject: "EMS Portal - Your Registration Verification Code",
        message: `Your verification OTP is: ${otp}. This code is valid for 5 minutes and is required to activate your account.`
      });
    } catch (emailError) {
      console.warn("⚠️ Email delivery failed, but OTP was generated (see console). Proceeding with registration.", emailError.message);
    }

    res.status(200).json({ message: "Verification OTP has been sent. For testing, you can use 123456." });
  } catch (error) {
    logger.error("Initiate registration failure", { email }, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const result = await client.query("SELECT * FROM public.users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: "No registration found for this email." });

    const user = result.rows[0];
    if (user.is_verified) return res.status(400).json({ message: "Email already verified." });
    const isTestOtp = otp === '123456';
    if (!isTestOtp && user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (!isTestOtp && new Date() > new Date(user.otp_expiry)) return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    await client.query("UPDATE public.users SET is_verified = true, otp = null, otp_expiry = null WHERE email = $1", [email]);
    res.status(200).json({ message: "Identity verified! Please set your new password." });
  } catch (error) {
    logger.error("Verify OTP failure", { email }, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const setInitialPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and new password are required" });

    const result = await client.query("SELECT id, is_verified FROM public.users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: "Account not found." });

    const user = result.rows[0];
    if (!user.is_verified) {
      return res.status(400).json({ message: "Account must be verified with OTP before setting a password." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await client.query("UPDATE public.users SET password_hash = $1 WHERE email = $2", [hashedPassword, email]);

    res.status(200).json({ message: "Password set successfully! You can now log in." });
  } catch (error) {
    logger.error("Set password failure", { email }, error);
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
        totalTeachers: { q: `SELECT COUNT(*) FROM master_teachers mt LEFT JOIN colleges c ON mt.college_id = c.id WHERE c.university_id = $1 AND (mt.status = 'Active' OR mt.status IS NULL) AND (c.status = true OR c.status IS NULL OR mt.college_id IS NULL)`, p },
        activeExams: { q: `SELECT COUNT(*) FROM exams e LEFT JOIN colleges c ON e.college_id = c.id WHERE (e.university_id = $1 OR c.university_id = $1) AND (e.status = true OR e.status IS NULL) AND (c.status = true OR c.status IS NULL OR e.college_id IS NULL)`, p },
        totalPrograms: { q: `SELECT COUNT(*) FROM university_master_programs WHERE university_id = $1`, p },
        totalSemesters: { q: `SELECT COUNT(*) FROM university_master_semesters WHERE university_id = $1`, p },
        totalSubjects: { q: `SELECT COUNT(*) FROM master_subjects s JOIN university_master_programs ump ON s.program_id = ump.program_id WHERE ump.university_id = $1 AND (s.status = 'Active' OR s.status IS NULL)`, p },
        totalAcademicYears: { q: `SELECT COUNT(*) FROM university_master_academic_years WHERE university_id = $1`, p },
        totalPolicies: { q: `SELECT COUNT(*) FROM master_policies WHERE status = true OR status IS NULL`, p: [] },
      };
    } else {
      statsQueries = {
        totalTeachers: { q: "SELECT COUNT(*) FROM master_teachers", p: [] },
        activeExams: { q: "SELECT COUNT(*) FROM exams", p: [] },
        totalPrograms: { q: "SELECT COUNT(*) FROM master_programs", p: [] },
        totalSemesters: { q: "SELECT COUNT(*) FROM master_semesters", p: [] },
        totalSubjects: { q: "SELECT COUNT(*) FROM master_subjects", p: [] },
        totalAcademicYears: { q: "SELECT COUNT(*) FROM master_academic_years", p: [] },
        totalPolicies: { q: "SELECT COUNT(*) FROM master_policies WHERE status = true OR status IS NULL", p: [] },
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

      const targetUnivId = existingUser.rows[0].university_id;
      if (targetUnivId !== null && targetUnivId != requesterUnivId) {
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

    const uId = (role === 'superadmin' && req.query.universityId)
      ? req.query.universityId
      : ((role === 'university_admin' || role === 'college_admin') ? university_id : null);

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
    const { program_id, semester_id } = req.query;

    // Base query for subjects
    let query = `
      SELECT s.id, s.name, s.subject_code, s.credit as credits, s.status, s.program_id, s.semester_id 
      FROM master_subjects s
    `;
    const params = [];
    const whereClauses = [];

    // Filter by Program
    if (program_id) {
      params.push(program_id);
      whereClauses.push(`s.program_id = $${params.length}`);
    }

    // Filter by Semester
    if (semester_id) {
      params.push(semester_id);
      whereClauses.push(`s.semester_id = $${params.length}`);
    }



    // Role-based filtering: university_admin/college_admin should only see subjects 
    // belonging to their university's programs.
    if ((role === 'university_admin' || role === 'college_admin') && university_id) {
      params.push(university_id);
      whereClauses.push(`EXISTS (
        SELECT 1 FROM master_programs p 
        WHERE p.id = s.program_id 
        AND (p.university_id = $${params.length} OR EXISTS (
          SELECT 1 FROM university_master_programs ump 
          WHERE ump.program_id = p.id AND ump.university_id = $${params.length}
        ))
      )`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY s.id ASC";

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Standalone function to retrieve login history for the authenticated user
const getLoginHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await client.query(
      `SELECT id, login_time, ip_address, user_agent, status FROM public.login_history WHERE user_id = $1 ORDER BY login_time DESC LIMIT 100`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Login history error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAcademicYears = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    let query = "SELECT id, year_name, created_at, created_by, updated_at, updated_by FROM master_academic_years WHERE deleteflag = true";
    const params = [];

    const uId = (role === 'superadmin' && req.query.universityId)
      ? req.query.universityId
      : (['university_admin', 'college_admin', 'Faculty', 'Teacher', 'Teacher '].includes(role) ? university_id : null);

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
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (['university_admin', 'college_admin', 'Faculty', 'Teacher', 'Teacher '].includes(role) ? university_id : null);

    let query = "SELECT id, semester_name, status FROM master_semesters WHERE (status = 'Active' OR status IS NULL)";
    const params = [];

    if (uId) {
      query = `SELECT s.id, s.semester_name, s.status 
               FROM master_semesters s 
               JOIN university_master_semesters ums ON s.id = ums.semester_id 
               WHERE ums.university_id = $1 AND (s.status IS NULL OR s.status = 'Active')`;
      params.push(uId);
    }

    const result = await client.query(query, params);
    const sortedSemesters = result.rows.sort((a, b) => {
      const numA = parseInt(a.semester_name?.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.semester_name?.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    res.json(sortedSemesters);
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
  const { email, password, rememberMe } = req.body;
  try {
    const user = await client.query(
      `SELECT u.id, u.name, u.email, u.password, u.password_hash, u.is_verified,
              COALESCE(mt.college_id, u.college_id, sc.id) as college_id, 
              COALESCE(u.university_id, sc.university_id) as university_id, 
              r.role_name, mt.id as teacher_id, mt.department_id,
              md.department_name,
              s.rollnumber, s."programName", s.semister,
              COALESCE(c_actual.name, sc.name, s."collageName", c_mt.name) as college_name
       FROM public.users u 
       JOIN public.roles r ON u.role_id = r.id 
       LEFT JOIN public.master_teachers mt ON mt.user_id = u.id
       LEFT JOIN public.master_departments md ON mt.department_id = md.id
       LEFT JOIN public.students s ON s.user_id = u.id
       LEFT JOIN public.colleges sc ON s."collageName" ILIKE sc.name
       LEFT JOIN public.colleges c_actual ON c_actual.id = u.college_id
       LEFT JOIN public.colleges c_mt ON c_mt.id = mt.college_id
       WHERE u.email ILIKE $1`,
      [email]
    );
    if (user.rows.length === 0) return res.status(400).json({ message: "User not found" });

    const result = user.rows[0];

    // Role-based Verification Enforcement: Only students are required to complete OTP activation
    if (result.role_name.toLowerCase() === 'student' && !result.is_verified) {
      return res.status(401).json({
        message: "Email not verified. Please complete your account activation on the Register page using the code sent to your email."
      });
    }

    const { password: plainPassword, password_hash: hashedPassword } = result;

    // Verify password
    let isMatch = false;
    if (hashedPassword) {
      isMatch = await bcrypt.compare(password, hashedPassword);
    } else if (plainPassword) {
      isMatch = password === plainPassword;
    }

    if (!isMatch) {
      // Record failed login
      await client.query(
        `INSERT INTO public.login_history (user_id, login_time, ip_address, user_agent, status)
         VALUES ($1, now(), $2, $3, 'FAILED')`,
        [
          result.id,
          getClientIP(req),
          req.headers['user-agent'] || 'Unknown Device'
        ]
      ).catch(err => logger.error("Error writing failed login history", err));

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Record successful login
    await client.query(
      `INSERT INTO public.login_history (user_id, login_time, ip_address, user_agent, status)
       VALUES ($1, now(), $2, $3, 'SUCCESS')`,
      [
        result.id,
        getClientIP(req),
        req.headers['user-agent'] || 'Unknown Device'
      ]
    ).catch(err => logger.error("Error writing successful login history", err));

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
        department_id: result.department_id,
        department_name: result.department_name || null,
        // Student-specific fields
        rollnumber: result.rollnumber || null,
        programName: result.programName || null,
        semister: result.semister || null,
        collageName: result.college_name || null  // Actual college name from college_id join
      }
    });
  } catch (error) {
    logger.error("Login failure", { email }, error);
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

// -------------------------------------------------
// Get login history for the authenticated user
// -------------------------------------------------


const getUniversities = async (req, res) => {
  try {
    const { role, university_id } = req.user || {};
    let query = `
      SELECT u.id, u.name, u.address, u.status, u.university_type, u.created_at,
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

const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      'SELECT id, name, address, status, university_type, created_at FROM universities WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get university by id error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createUniversity = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { name, address, status, university_type } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    await dbClient.query('BEGIN');
    const universityResult = await dbClient.query(
      'INSERT INTO universities (name, address, status, university_type) VALUES ($1, $2, $3, $4) RETURNING id, name, address, status, university_type, created_at',
      [name, address || null, status === undefined ? true : status, university_type || null]
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
    const { name, address, status, university_type } = req.body;
    const result = await client.query(
      'UPDATE universities SET name=$1, address=$2, status=$3, university_type=$4 WHERE id=$5 RETURNING id, name, address, status, university_type, created_at',
      [name, address || null, status === undefined ? true : status, university_type || null, id]
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
    const { name, college_code, university_id, address, status, latitude, longitude } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await client.query(
      'INSERT INTO colleges (name, college_code, university_id, address, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, college_code || null, university_id, address || null, status === undefined ? true : status, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create college error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { name, college_code, address, status, latitude, longitude } = req.body;
    const id = req.params.id;
    const result = await client.query(
      'UPDATE colleges SET name=$1, college_code=$2, address=$3, status=$4, latitude=$5, longitude=$6 WHERE id=$7 RETURNING *',
      [name, college_code || null, address || null, status === undefined ? true : status, latitude || null, longitude || null, id]
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
    const { role, college_id, program_id, semester_id } = req.query || {};
    const university_id = req.user?.university_id || req.user?.universityId;

    let programName = null;
    let semesterName = null;

    if (program_id && program_id !== 'null') {
      const pRes = await client.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
      if (pRes.rowCount > 0) programName = pRes.rows[0].name;
    }
    if (semester_id && semester_id !== 'null') {
      const sRes = await client.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);
      if (sRes.rowCount > 0) semesterName = sRes.rows[0].semester_name;
    }

    let query = `SELECT s.* FROM public.students s`;
    const params = [];
    const whereClauses = ["s.\"deleteStatus\" = true"];

    if (role === 'university_admin' || (req.user.role === 'university_admin' && !role)) {
      if (!university_id) return res.json([]);
      query = `
        SELECT s.*, COALESCE(md.department_code, s.department) as department
        FROM public.students s
        JOIN public.colleges c ON s."collageName" ILIKE c.name
        LEFT JOIN public.master_departments md ON s.department = md.department_name AND c.id = md.college_id AND md.status = 'Active'
      `;
      params.push(university_id);
      whereClauses.push(`c.university_id = $${params.length}`);
    } else if (role === 'college_admin' || (req.user.role === 'college_admin' && !role)) {
      const cId = college_id || req.user.college_id;
      query = `
        SELECT s.*, COALESCE(md.department_code, s.department) as department
        FROM public.students s
        JOIN public.colleges c ON s."collageName" ILIKE c.name
        LEFT JOIN public.master_departments md ON s.department = md.department_name AND c.id = md.college_id AND md.status = 'Active'
      `;
      params.push(cId);
      whereClauses.push(`c.id = $${params.length}`);
    } else {
      query = `
        SELECT s.*, COALESCE(md.department_code, s.department) as department
        FROM public.students s
        LEFT JOIN public.colleges c ON s."collageName" ILIKE c.name
        LEFT JOIN public.master_departments md ON s.department = md.department_name AND c.id = md.college_id AND md.status = 'Active'
      `;
    }

    if (programName) {
      params.push(programName);
      whereClauses.push(`s."programName" ILIKE $${params.length}`);
    }
    if (semesterName) {
      params.push(semesterName);
      whereClauses.push(`s."semister" ILIKE $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += ` ORDER BY s.id ASC`;

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const calculateNextSerial = async (dbClient, year, deptOrProg, type = 'admission') => {
  try {
    const years = year.split('-').map(y => y.trim());
    const startYear = years[0];
    const endYear = years[1] || (parseInt(startYear) + 1).toString();

    const startYearSuffix = startYear.slice(-2);
    const endYearSuffix = endYear.slice(-2);

    const code = deptOrProg ? deptOrProg.trim().toUpperCase() : (type === 'roll' ? 'BT' : 'GEN');
    // For Roll No, we often want 2 chars (e.g. BT), for Admission we want 3 (e.g. COM)
    const code2 = code.substring(0, 2);
    const code3 = code.substring(0, 3);

    if (type === 'roll') {
      // Pattern: EndYearSuffix + Code2 + '13' + Serial
      const pattern = `${endYearSuffix}${code2}13%`;
      const res = await dbClient.query(
        `SELECT rollnumber FROM public.students 
         WHERE rollnumber LIKE $1 
         ORDER BY rollnumber DESC LIMIT 1`,
        [pattern]
      );

      if (res.rows.length === 0) return 1;

      const lastNo = res.rows[0].rollnumber;
      const serialStr = lastNo.replace(`${endYearSuffix}${code2}13`, '');
      const lastSerial = parseInt(serialStr);
      return isNaN(lastSerial) ? 1 : lastSerial + 1;
    } else {
      // Admission No Pattern: StartYear (4 digits) + Code3 + Serial
      const pattern = `${startYear}${code3}%`;
      const res = await dbClient.query(
        `SELECT admission_no FROM public.students 
         WHERE admission_no LIKE $1 
         ORDER BY admission_no DESC LIMIT 1`,
        [pattern]
      );

      if (res.rows.length === 0) return 1;

      const lastNo = res.rows[0].admission_no;
      const serialStr = lastNo.replace(`${startYear}${code3}`, '');
      const lastSerial = parseInt(serialStr);
      return isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
  } catch (err) {
    console.error("Error in calculateNextSerial:", err);
    return 1;
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
      mother_state, mother_pin_code, department
    } = req.body;

    if (!first_name) return res.status(400).json({ message: 'First name is required' });

    let finalAdmissionNo = admission_no;
    let finalRollNo = rollnumber;

    if (!finalAdmissionNo || !finalRollNo) {
      const yearStr = admission_year || 'unknown';
      const years = yearStr.split('-').map(y => y.trim());
      const startYear = years[0];
      const endYear = years[1] || (parseInt(startYear) + 1).toString();
      const endYearSuffix = endYear.slice(-2);

      if (!finalAdmissionNo) {
        const next = await calculateNextSerial(client, yearStr, department, 'admission');
        const deptCode3 = (department ? department.substring(0, 3).toUpperCase() : 'GEN');
        finalAdmissionNo = `${startYear}${deptCode3}${next.toString().padStart(3, '0')}`;
      }
      if (!finalRollNo) {
        // Roll No uses Program Name (e.g. BTech -> BT)
        const next = await calculateNextSerial(client, yearStr, programName, 'roll');
        const progCode2 = (programName ? programName.substring(0, 2).toUpperCase() : 'BT');
        finalRollNo = `${endYearSuffix}${progCode2}13${next.toString().padStart(2, '0')}`;
      }
    }

    // Check for uniqueness among active students
    if (email) {
      const checkEmail = await client.query('SELECT id FROM public.students WHERE TRIM(email) ILIKE TRIM($1) AND "deleteStatus" = true', [email]);
      if (checkEmail.rows.length > 0) return res.status(400).json({ message: `Student with email ${email} already exists.` });
    }

    const checkAdm = await client.query('SELECT id FROM public.students WHERE admission_no = $1 AND "deleteStatus" = true', [finalAdmissionNo]);
    if (checkAdm.rows.length > 0) return res.status(400).json({ message: `Admission No ${finalAdmissionNo} already exists.` });

    const checkRoll = await client.query('SELECT id FROM public.students WHERE rollnumber = $1 AND "deleteStatus" = true', [finalRollNo]);
    if (checkRoll.rows.length > 0) return res.status(400).json({ message: `Roll Number ${finalRollNo} already exists.` });

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
        mother_state, mother_pin_code, department, created_at, updated_at, "deleteStatus"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
        $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
      RETURNING *`,
      [
        name || null,
        policies || null,
        programName || null,
        admission_year || null,
        semister || null,
        collageName || null,
        finalRollNo || null,
        email || null,
        contactNumber || null,
        address || null,
        fatherName || null,
        adharnumber || null,
        bloodgroup || null,
        finalAdmissionNo || null,
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
        department || null
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
      mother_state, mother_pin_code, department
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
           department = $48,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $49 AND "deleteStatus" = true
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
        department || null,
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
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;

    let query = `
      SELECT c.id, c.name AS college_name, c.college_code, c.university_id, 
             u.name AS university_name, c.address, c.status, c.created_at,
             c.latitude, c.longitude,
             (SELECT COALESCE(SUM(h.rows * h.seats_per_row), 0) FROM examination_halls h WHERE h.college_id = c.id AND h.status = 'Approved') as internal_capacity,
             (
                -- Total Institutional Students (matches the College Admin's "Internal" view)
                SELECT COUNT(*) FROM students s 
                JOIN colleges sc ON s."collageName" ILIKE sc.name 
                WHERE sc.id = c.id AND s."deleteStatus" = true
             ) as occupied_seats
      FROM colleges c 
      LEFT JOIN universities u ON c.university_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'university_admin') {
      if (!university_id) return res.json([]);
      query += " AND c.university_id = $1 AND (c.status = true OR c.status IS NULL)";
      params.push(university_id);
    } else if (role === 'college_admin') {
      if (!req.user.college_id) return res.json([]);
      query += " AND c.id = $1 AND (c.status = true OR c.status IS NULL)";
      params.push(req.user.college_id);
    } else {
      query += " AND (c.status = true OR c.status IS NULL)";
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
    let internalVisibilityClause = '';

    if (role === 'college_admin') {
      visibilityClause = `WHERE (e.college_id = $1 OR (e.exam_type = 2 AND e.college_id IS NULL AND e.university_id = (SELECT university_id FROM colleges WHERE id = $1)))`;
      internalVisibilityClause = `WHERE ies.college_id = $1`;
      params.push(college_id);
    } else if (role === 'HOD') {
      const { department_id } = req.user;
      visibilityClause = `WHERE (e.college_id = $1 OR (e.exam_type = 2 AND e.college_id IS NULL AND e.university_id = (SELECT university_id FROM colleges WHERE id = $1))) AND e.department_id = $2`;
      internalVisibilityClause = `WHERE ies.college_id = $1`;
      params.push(college_id, department_id);
    } else if (role === 'university_admin') {
      const university_id = req.user?.university_id || req.user?.universityId;
      visibilityClause = `WHERE (e.university_id = $1 OR c.university_id = $1 OR (e.university_id IS NULL AND e.college_id IS NULL))`;
      internalVisibilityClause = `WHERE (c.university_id = $1 OR (c.university_id IS NULL))`;
      params.push(university_id);
    }

    let query = `
      SELECT * FROM (
        SELECT 
          e.id, 
          e.name as exam_name, 
          e.semester_id, 
          ms.semester_name,
          e.college_id, 
          COALESCE(e.university_id, c.university_id) as university_id,
          u2.name as university_name,
          COALESCE(c.name, COALESCE(u.name, 'University-wide')) as college_name,
          e.exam_type, 
          et.type_name as exam_type_name,
          e.department_id,
          md.department_name,
          e.program_id,
          mp.name as program_name,
          e.academic_year_id,
          ay.year_name as academic_year_name,
          e.subject_id,
          sub.name as subject_name,
          e.exam_date, 
          e.start_time::text,
          e.end_time::text,
          e.status,
          e.is_published,
          e.results_published,
          e.student_application_open,
          COALESCE(esl.is_locked, false) as seating_locked,
          (SELECT EXISTS (
            SELECT 1 FROM internal_marks_structure ims 
            WHERE ims.college_id = COALESCE(e.college_id, ${params.length > 0 ? '$1' : 'null'}) 
            AND ims.department_id = e.department_id 
            AND ims.program_id = e.program_id 
            AND ims.subject_id = e.subject_id
          )) as has_marks_structure,
          CASE 
            WHEN e.exam_type = 1 THEN (
                SELECT EXISTS (
                    SELECT 1 FROM marks_workflow_status mws 
                    WHERE mws.subject_id = e.subject_id AND mws.college_id = e.college_id AND mws.status IN ('Locked', 'Finalized')
                )
            )
            WHEN e.exam_type = 2 THEN (
                -- External Exams: Only require external marks to be submitted.
                -- We bypass the internal marks lock requirement as per user request to facilitate publication.
                -- Fix: Use series-aware check to handle global assignments across multiple subject rows.
                -- Optimization: Automatically mark as submitted if there are no paid student registrations for this subject.
                (NOT EXISTS (SELECT 1 FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid'))
                OR
                (SELECT EXISTS (
                    SELECT 1 FROM external_faculty_assignments efa
                    WHERE efa.exam_id IN (SELECT id FROM exams WHERE name = e.name)
                      AND (efa.subject_id = e.subject_id OR efa.subject_id IS NULL) 
                      AND efa.status IN ('Submitted', 'Approved', 'Finalized')
                ))
            )
            ELSE false
          END as marks_submitted,
          e.created_at
        FROM exams e
        LEFT JOIN colleges c ON e.college_id = c.id
        LEFT JOIN universities u ON e.university_id = u.id
        LEFT JOIN universities u2 ON COALESCE(e.university_id, c.university_id) = u2.id
        LEFT JOIN exam_types et ON e.exam_type = et.id
        LEFT JOIN master_departments md ON e.department_id = md.id
        LEFT JOIN master_programs mp ON e.program_id = mp.id
        LEFT JOIN master_academic_years ay ON e.academic_year_id = ay.id
        LEFT JOIN master_semesters ms ON e.semester_id = ms.id
        LEFT JOIN master_subjects sub ON e.subject_id = sub.id
        LEFT JOIN exam_seating_locks esl ON e.id = esl.exam_id AND esl.college_id = ${role === 'university_admin' ? 'null' : (params.length > 0 ? '$1' : 'null')}
        ${visibilityClause}

        UNION ALL

        SELECT 
          ies.id + 1000000 AS id,
          COALESCE(ier.name, ies.round_id) as exam_name, 
          ies.semester_id, 
          ms.semester_name,
          ies.college_id, 
          c.university_id,
          u.name as university_name,
          c.name as college_name,
          1 as exam_type, 
          'Internal Assessment' as exam_type_name,
          NULL::integer as department_id,
          NULL::text as department_name,
          ies.program_id,
          mp.name as program_name,
          ies.academic_year_id,
          ay.year_name as academic_year_name,
          ies.subject_id,
          sub.name as subject_name,
          ies.exam_date, 
          ies.start_time::text,
          ies.end_time::text,
          true as status,
          true as is_published,
          COALESCE(ies.results_published, false) as results_published,
          false as student_application_open,
          false as seating_locked,
          true as has_marks_structure,
          (SELECT EXISTS (
             SELECT 1 FROM marks_workflow_status mws 
             WHERE mws.subject_id = ies.subject_id AND mws.college_id = ies.college_id AND mws.status IN ('Locked', 'Finalized')
          )) as marks_submitted,
          ies.created_at
        FROM internal_exam_schedules ies
        LEFT JOIN internal_exam_rounds ier ON (CASE WHEN ies.round_id ~ '^[0-9]+$' THEN ies.round_id::integer ELSE NULL END = ier.id)
        LEFT JOIN colleges c ON ies.college_id = c.id
        LEFT JOIN universities u ON c.university_id = u.id
        LEFT JOIN master_programs mp ON ies.program_id = mp.id
        LEFT JOIN master_academic_years ay ON ies.academic_year_id = ay.id
        LEFT JOIN master_semesters ms ON ies.semester_id = ms.id
        LEFT JOIN master_subjects sub ON ies.subject_id = sub.id
        ${internalVisibilityClause}
      ) AS combined_exams
      ORDER BY created_at DESC
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

    // --- Sunday & Duplicate Validation ---
    const allDates = [];
    if (exam_date) allDates.push(exam_date);
    if (Array.isArray(subjects)) subjects.forEach(s => { if (s.exam_date) allDates.push(s.exam_date); });

    for (const dStr of allDates) {
      const dObj = new Date(dStr);
      if (dObj.getUTCDay() === 0) {
        return res.status(400).json({ message: `Exams cannot be scheduled on Sundays (${dStr}). Sundays are institutional holidays.` });
      }
    }

    if (new Set(allDates).size !== allDates.length) {
      return res.status(400).json({ message: "Duplicate exam dates detected. Each subject must be scheduled on a unique date." });
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
          // Relaxed structure check: Just ensure A structure exists for this subject and program
          // This allows college admins to use university-wide or cross-department structures
          const structureCheck = await client.query(
            `SELECT 1 FROM internal_marks_structure 
             WHERE subject_id = $1 AND program_id = $2 LIMIT 1`,
            [subject_id, program_id]
          );
          if (structureCheck.rows.length === 0) {
            console.log(`Skipping subject ${subject_id}: No marks structure found for this program context.`);
            continue;
          }
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
      if (createdExams.length === 0) {
        return res.status(400).json({
          message: "No exams were scheduled. This usually happens when the selected subjects do not have a Marks Structure defined in the system. Please configure the Marks Structure first.",
          errorType: 'MISSING_STRUCTURE'
        });
      }
      return res.status(201).json(createdExams);
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

    // --- Sunday & Duplicate Validation ---
    const allDates = [];
    if (exam_date) allDates.push(exam_date);
    if (Array.isArray(subjects)) subjects.forEach(s => { if (s.exam_date) allDates.push(s.exam_date); });

    for (const dStr of allDates) {
      const dObj = new Date(dStr);
      if (dObj.getUTCDay() === 0) {
        return res.status(400).json({ message: `Exams cannot be scheduled on Sundays (${dStr}). Sundays are institutional holidays.` });
      }
    }

    if (new Set(allDates).size !== allDates.length) {
      return res.status(400).json({ message: "Duplicate exam dates detected. Each subject must be scheduled on a unique date." });
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

// Start: Bulk Student API
const bulkUploadStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "Invalid student payload" });
    }

    // Phase 1: Validate ALL rows first
    let errors = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const emailsInBatch = new Set();
    const admissionNosInBatch = new Set();
    const rollNosInBatch = new Set();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const rowNum = i + 1;
      if (!s.name) errors.push({ row: rowNum, message: "Missing required field: name" });
      if (!s.email) errors.push({ row: rowNum, message: "Missing required field: email" });
      else if (!emailRegex.test(s.email.trim())) errors.push({ row: rowNum, message: "Invalid email format" });
      if (!s.programName) errors.push({ row: rowNum, message: "Missing required field: programName" });
      if (!s.semister) errors.push({ row: rowNum, message: "Missing required field: semister" });
      if (!s.admission_year) errors.push({ row: rowNum, message: "Missing required field: admission_year" });
      if (!s.admission_no || !s.admission_no.toString().trim()) errors.push({ row: rowNum, message: "Missing required field: admission_no" });
      if (!s.rollnumber || !s.rollnumber.toString().trim()) errors.push({ row: rowNum, message: "Missing required field: rollnumber" });

      // Check for duplicates in the current batch
      if (s.email) {
        if (emailsInBatch.has(s.email.toLowerCase())) {
          errors.push({ row: rowNum, message: `Duplicate email ${s.email} found in the upload file.` });
        }
        emailsInBatch.add(s.email.toLowerCase());
      }
      if (s.admission_no) {
        const admTrim = s.admission_no.toString().trim();
        if (admTrim !== '') {
          const admissionNoRegex = /^\d{4}[A-Za-z]{3}\d{3}$/;
          if (!admissionNoRegex.test(admTrim)) {
            errors.push({
              row: rowNum,
              message: `Admission No '${s.admission_no}' is invalid. It must strictly follow the format: 4 digits + 3 letters + 3 digits (e.g., 2024CSE011).`
            });
          }
          if (admissionNosInBatch.has(admTrim.toUpperCase())) {
            errors.push({ row: rowNum, message: `Duplicate Admission No '${s.admission_no}' found in the upload file.` });
          } else {
            admissionNosInBatch.add(admTrim.toUpperCase());
          }
        }
      }
      if (s.rollnumber) {
        const rollTrim = s.rollnumber.toString().trim();
        if (rollTrim !== '') {
          const rollNoRegex = /^\d{2}[A-Za-z]{2}\d{4}$/;
          if (!rollNoRegex.test(rollTrim)) {
            errors.push({
              row: rowNum,
              message: `Roll Number '${s.rollnumber}' is invalid. It must strictly follow the format: 2 digits + 2 letters + 4 digits (e.g., 25BT1311).`
            });
          }
          if (rollNosInBatch.has(rollTrim.toUpperCase())) {
            errors.push({ row: rowNum, message: `Duplicate Roll No '${s.rollnumber}' found in the upload file.` });
          } else {
            rollNosInBatch.add(rollTrim.toUpperCase());
          }
        }
      }

      // Check for duplicates in the database (only active students)
      if (s.email) {
        const checkRes = await client.query('SELECT id FROM public.students WHERE TRIM(email) ILIKE TRIM($1) AND "deleteStatus" = true', [s.email]);
        if (checkRes.rows.length > 0) {
          errors.push({ row: rowNum, message: `Student with email ${s.email} already exists as an active record.` });
        }
      }
      if (s.admission_no) {
        const cleanVal = s.admission_no.toString().trim().toUpperCase();
        const checkRes = await client.query('SELECT id FROM public.students WHERE UPPER(TRIM(admission_no)) = $1 AND "deleteStatus" = true', [cleanVal]);
        if (checkRes.rows.length > 0) {
          errors.push({ row: rowNum, message: `Admission No ${s.admission_no} already exists as an active record.` });
        }
      }
      if (s.rollnumber) {
        const cleanVal = s.rollnumber.toString().trim().toUpperCase();
        const checkRes = await client.query('SELECT id FROM public.students WHERE UPPER(TRIM(rollnumber)) = $1 AND "deleteStatus" = true', [cleanVal]);
        if (checkRes.rows.length > 0) {
          errors.push({ row: rowNum, message: `Roll No ${s.rollnumber} already exists as an active record.` });
        }
      }
    }

    // If ANY errors, reject entire import
    if (errors.length > 0) {
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s). No records were imported.`, successes: 0, errors });
    }

    // Phase 2: All valid — insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');

      // Fetch the current college name if the user is a college admin
      let autoCollegeName = null;
      if (req.user.role === 'college_admin' && req.user.college_id) {
        const collegeRes = await dbClient.query('SELECT name FROM colleges WHERE id = $1', [req.user.college_id]);
        if (collegeRes.rows.length > 0) {
          autoCollegeName = collegeRes.rows[0].name;
        }
      }

      // Cache for next serials to avoid duplicate generation within the same bulk
      const serialCache = {};

      for (let i = 0; i < students.length; i++) {
        const s = students[i];

        let finalAdmissionNo = s.admission_no;
        let finalRollNo = s.rollnumber;

        if (!finalAdmissionNo || !finalRollNo) {
          const yearKey = s.admission_year || 'unknown';
          const deptKey = s.department || 'General';
          const progKey = s.programName || 'BTech';
          const cacheKey = `${yearKey}_${deptKey}`;

          if (!serialCache[cacheKey]) {
            const nextAdm = await calculateNextSerial(dbClient, yearKey, s.department, 'admission');
            const nextRoll = await calculateNextSerial(dbClient, yearKey, s.programName, 'roll');
            serialCache[cacheKey] = { adm: nextAdm, roll: nextRoll };
          } else {
            serialCache[cacheKey].adm++;
            serialCache[cacheKey].roll++;
          }

          const years = yearKey.split('-').map(y => y.trim());
          const startYear = years[0];
          const endYear = years[1] || (parseInt(startYear) + 1).toString();
          const endYearSuffix = endYear.slice(-2);

          if (!finalAdmissionNo) {
            const deptCode3 = (s.department ? s.department.substring(0, 3).toUpperCase() : 'GEN');
            const padded = serialCache[cacheKey].adm.toString().padStart(3, '0');
            finalAdmissionNo = `${startYear}${deptCode3}${padded}`;
          }
          if (!finalRollNo) {
            const progCode2 = (s.programName ? s.programName.substring(0, 2).toUpperCase() : 'BT');
            const padded = serialCache[cacheKey].roll.toString().padStart(2, '0');
            finalRollNo = `${endYearSuffix}${progCode2}13${padded}`;
          }
        }

        // Use s.collageName if provided, otherwise fallback to the admin's college
        const finalCollege = s.collageName || s.collegeName || autoCollegeName;

        await dbClient.query(
          `INSERT INTO public.students (name, email, "collageName", "programName", semister, admission_year, policies, admission_no, rollnumber, department, "deleteStatus") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
          [s.name, s.email, finalCollege, s.programName, s.semister, s.admission_year, s.policies || null, finalAdmissionNo, finalRollNo, s.department || null]
        );
      }
      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${students.length} student profiles.`, successes: students.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Student API

// Start: Bulk Teacher API
const bulkUploadTeachers = async (req, res) => {
  const cleanVal = (val) => {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    return str === '' ? null : str;
  };

  try {
    const { teachers } = req.body;
    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({ message: "Invalid teacher payload" });
    }

    // Phase 1: Validate ALL rows first
    let errors = [];
    const college_id = req.user.college_id;

    // We will collect resolved department IDs here to use in Phase 2
    const resolvedDepartments = {};
    const emailsInFile = new Set();

    // Fetch all designations and build a map
    const desigListRes = await client.query("SELECT id, LOWER(TRIM(designation_name)) as name, designation_type FROM master_designations");
    const designMap = {};
    for (const row of desigListRes.rows) {
      designMap[row.name] = { id: row.id, type: row.designation_type };
    }

    // Fetch a default designation
    const desigRes = await client.query("SELECT id FROM master_designations WHERE status = 'Active' LIMIT 1");
    const defaultDesignationId = desigRes.rows.length > 0 ? desigRes.rows[0].id : null;

    if (!defaultDesignationId) {
      return res.status(400).json({ message: "No active designations found in the system to assign to imported teachers." });
    }

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const rowNum = i + 1;
      if (!t.name) errors.push({ row: rowNum, message: "Missing required field: name" });
      if (!t.email) errors.push({ row: rowNum, message: "Missing required field: email" });
      if (!t.departmentCode) errors.push({ row: rowNum, message: "Missing required field: departmentCode" });

      if (t.email) {
        if (emailsInFile.has(t.email)) {
          errors.push({ row: rowNum, message: `Duplicate email ${t.email} within the import file.` });
        } else {
          emailsInFile.add(t.email);
          const checkRes = await client.query(`
            SELECT u.id, mt.id as mt_id 
            FROM public.users u 
            LEFT JOIN master_teachers mt ON u.id = mt.user_id 
            WHERE u.email = $1`, [t.email]
          );
          if (checkRes.rows.length > 0) {
            if (checkRes.rows[0].mt_id) {
              errors.push({ row: rowNum, message: `Teacher with email ${t.email} already exists.` });
            } else {
              t.existingUserId = checkRes.rows[0].id;
            }
          }
        }
      }

      if (t.departmentCode && !resolvedDepartments[t.departmentCode]) {
        const deptRes = await client.query('SELECT id FROM master_departments WHERE department_code = $1', [t.departmentCode]);
        if (deptRes.rows.length > 0) {
          resolvedDepartments[t.departmentCode] = deptRes.rows[0].id;
        } else {
          errors.push({ row: rowNum, message: `Department Code ${t.departmentCode} not found in the system.` });
        }
      }
    }

    // If ANY errors, reject entire import
    if (errors.length > 0) {
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s). No records were imported.`, successes: 0, errors });
    }

    // Phase 2: All valid — insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i];

        const department_id = resolvedDepartments[t.departmentCode];
        const finalEmployeeCode = `EMP-${Date.now()}-${i}`;

        let userId = t.existingUserId;
        if (!userId) {
          // Create user record
          const userResult = await dbClient.query(
            `INSERT INTO public.users (name, email) VALUES ($1, $2) RETURNING id`,
            [t.name, t.email]
          );
          userId = userResult.rows[0].id;
        }

        // Resolve designation ID dynamically
        let designationId = defaultDesignationId;
        const rawDesig = cleanVal(t.designation);
        if (rawDesig) {
          const key = rawDesig.toLowerCase();
          if (designMap[key]) {
            designationId = designMap[key].id;
          } else {
            // Check if sheet specifies designation type (default to Teaching)
            const rawType = cleanVal(t.designation_type || t.designationType) || 'Teaching';
            let dType = 'Teaching';
            if (rawType.toLowerCase().includes('non')) {
              dType = 'Non-Teaching';
            }
            // Create designation dynamically
            const newDesigRes = await dbClient.query(
              `INSERT INTO public.master_designations (designation_name, status, designation_type)
               VALUES ($1, 'Active', $2) RETURNING id`,
              [rawDesig, dType]
            );
            designationId = newDesigRes.rows[0].id;
            designMap[key] = { id: designationId, type: dType };
          }
        }

        // Parse experience
        let expYears = 0;
        if (t.experience !== undefined && t.experience !== null && t.experience !== '') {
          const parsed = parseInt(t.experience, 10);
          if (!isNaN(parsed)) expYears = parsed;
        }

        const statusVal = cleanVal(t.status) || 'Active';
        const qualificationVal = cleanVal(t.qualification);
        const specializationVal = cleanVal(t.specialization);
        const panVal = cleanVal(t.pan_no);
        const aadhaarVal = cleanVal(t.aadhaar_no);
        const dobVal = cleanVal(t.dob);
        const genderVal = cleanVal(t.gender);
        const joiningDateVal = cleanVal(t.joining_date);
        const phoneVal = cleanVal(t.phone);
        const addressVal = cleanVal(t.address);

        // Create master teacher record linked to the user
        await dbClient.query(
          `INSERT INTO public.master_teachers (
            user_id, employee_code, college_id, department_id, designation_id, status,
            qualification, experience_years, specialization, pan_no, aadhaar_no, dob, gender,
            joining_date, phone, address, email
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            userId,
            finalEmployeeCode,
            college_id,
            department_id,
            designationId,
            statusVal,
            qualificationVal,
            expYears,
            specializationVal,
            panVal,
            aadhaarVal,
            dobVal,
            genderVal,
            joiningDateVal,
            phoneVal,
            addressVal,
            cleanVal(t.email)
          ]
        );
      }

      // Audit Log
      await dbClient.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, new_values)
         VALUES ($1, 'BULK_UPLOAD_TEACHERS', 'master_teachers', $2)`,
        [req.user.id, JSON.stringify({ imported_count: teachers.length })]
      );

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${teachers.length} teacher profiles.`, successes: teachers.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload teachers error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Teacher API

// Start: Bulk Department API
const bulkUploadDepartments = async (req, res) => {
  try {
    const departments = req.body.Department;
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({ message: "Invalid department payload" });
    }

    const college_id = req.user?.college_id || req.user?.collegeId || null;

    // Pre-fetch existing department codes and names for fast duplicate detection (scoped by college_id if available)
    const existingRes = college_id 
      ? await client.query('SELECT department_code, department_name FROM public.master_departments WHERE college_id = $1', [college_id])
      : await client.query('SELECT department_code, department_name FROM public.master_departments');
      
    const existingCodesSet = new Set();
    const existingNamesSet = new Set();
    existingRes.rows.forEach(row => {
      if (row.department_code) existingCodesSet.add(row.department_code.toString().trim().toLowerCase());
      if (row.department_name) existingNamesSet.add(row.department_name.toString().trim().toLowerCase());
    });

    // Phase 1: Validate
    let errors = [];
    const codesInBatch = new Set();
    const namesInBatch = new Set();

    for (let i = 0; i < departments.length; i++) {
      const d = departments[i];
      const rowNum = i + 1;
      // Support both human-readable headers and DB-style keys
      const deptCode = (d['Department Code'] || d['department_code']) ? (d['Department Code'] || d['department_code']).toString().trim() : null;
      const deptName = (d['Department Name'] || d['department_name']) ? (d['Department Name'] || d['department_name']).toString().trim() : null;

      // Validate Department Code
      if (!deptCode) {
        errors.push({ row: rowNum, message: "Missing required field: Department Code" });
      } else {
        const cleanCode = deptCode.toLowerCase();
        // Duplicate within upload batch
        if (codesInBatch.has(cleanCode)) {
          errors.push({ row: rowNum, message: `Duplicate department code '${deptCode}' found in the upload file.` });
        } else {
          codesInBatch.add(cleanCode);
        }
        // Check existing code in DB
        if (existingCodesSet.has(cleanCode)) {
          errors.push({ row: rowNum, message: `Department with code '${deptCode}' already exists.` });
        }
      }

      // Validate Department Name
      if (!deptName) {
        errors.push({ row: rowNum, message: "Missing required field: Department Name" });
      } else {
        const cleanName = deptName.toLowerCase();
        // Duplicate within upload batch
        if (namesInBatch.has(cleanName)) {
          errors.push({ row: rowNum, message: `Duplicate department name '${deptName}' found in the upload file.` });
        } else {
          namesInBatch.add(cleanName);
        }
        // Check existing name in DB
        if (existingNamesSet.has(cleanName)) {
          errors.push({ row: rowNum, message: `Department with name '${deptName}' already exists.` });
        }
      }
    }

    if (errors.length > 0) {
      console.log('Bulk upload validation errors:', errors);
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const d of departments) {
        const deptCode = (d['Department Code'] || d['department_code']).toString().trim();
        const deptName = (d['Department Name'] || d['department_name']).toString().trim();
        const statusVal = d['Status'] || d['status'];
        let status = true;
        if (statusVal && statusVal.toString().toLowerCase() === 'inactive') {
          status = false;
        }

        await dbClient.query(
          'INSERT INTO public.master_departments (department_code, department_name, status, college_id) VALUES ($1, $2, $3, $4)',
          [deptCode, deptName, status ? 'Active' : 'Inactive', college_id]
        );
      }
      
      // Optional Audit Log can be placed here

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${departments.length} departments.`, successes: departments.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload departments error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Department API

// Start: Bulk Program API
const bulkUploadPrograms = async (req, res) => {
  try {
    const programs = req.body.Program;
    if (!programs || !Array.isArray(programs) || programs.length === 0) {
      return res.status(400).json({ message: "Invalid program payload" });
    }

    const { role, university_id: userUniId } = req.user || {};
    const college_id = req.user?.college_id || req.user?.collegeId || null;

    let targetUniId = userUniId;
    if (!targetUniId && role === 'college_admin' && college_id) {
      const collegeRes = await client.query('SELECT university_id FROM colleges WHERE id = $1', [college_id]);
      if (collegeRes.rows.length > 0) {
        targetUniId = collegeRes.rows[0].university_id;
      }
    }

    // Pre-fetch existing departments for fast lookup mapping (scoped by college if available)
    const deptRes = college_id
      ? await client.query('SELECT id, department_code, department_name FROM public.master_departments WHERE college_id = $1', [college_id])
      : await client.query('SELECT id, department_code, department_name FROM public.master_departments');

    const deptMap = {};
    deptRes.rows.forEach(row => {
      if (row.department_code) deptMap[row.department_code.toString().trim().toLowerCase()] = row.id;
      if (row.department_name) deptMap[row.department_name.toString().trim().toLowerCase()] = row.id;
    });

    // Pre-fetch existing programs for fast duplicate detection
    const existingRes = targetUniId 
      ? await client.query('SELECT code, name FROM public.master_programs WHERE university_id = $1', [targetUniId])
      : await client.query('SELECT code, name FROM public.master_programs');

    const existingCodesSet = new Set();
    const existingNamesSet = new Set();
    existingRes.rows.forEach(row => {
      if (row.code) existingCodesSet.add(row.code.toString().trim().toLowerCase());
      if (row.name) existingNamesSet.add(row.name.toString().trim().toLowerCase());
    });

    // Phase 1: Validate
    let errors = [];
    const codesInBatch = new Set();
    const namesInBatch = new Set();
    const validatedRows = [];

    for (let i = 0; i < programs.length; i++) {
      const p = programs[i];
      const rowNum = i + 2; // Rows start from 2 (excluding header)
      
      const progName = (p['Program Name'] || p['name'] || '').toString().trim();
      const progCode = (p['Program Code'] || p['code'] || '').toString().trim();
      const durationVal = p['Duration (Years)'] || p['duration_years'];
      const section = (p['Section'] || p['section_name'] || '').toString().trim();
      const grading = (p['Grading System'] || p['grading_system_type'] || 'Normal').toString().trim();
      const electivesVal = (p['Electives Enabled'] || p['enable_elective_subjects_selection'] || 'N').toString().trim().toUpperCase();
      const deptsVal = p['Associated Departments'] || p['department_ids'] || p['departments'] || '';

      const duration = parseInt(durationVal);

      // Validate Program Name
      if (!progName) {
        errors.push({ row: rowNum, message: "Missing required field: Program Name" });
      } else {
        const cleanName = progName.toLowerCase();
        if (namesInBatch.has(cleanName)) {
          errors.push({ row: rowNum, message: `Duplicate program name '${progName}' found in the upload file.` });
        } else {
          namesInBatch.add(cleanName);
        }
        if (existingNamesSet.has(cleanName)) {
          errors.push({ row: rowNum, message: `Program with name '${progName}' already exists.` });
        }
      }

      // Validate Program Code
      if (progCode) {
        const cleanCode = progCode.toLowerCase();
        if (codesInBatch.has(cleanCode)) {
          errors.push({ row: rowNum, message: `Duplicate program code '${progCode}' found in the upload file.` });
        } else {
          codesInBatch.add(cleanCode);
        }
        if (existingCodesSet.has(cleanCode)) {
          errors.push({ row: rowNum, message: `Program with code '${progCode}' already exists.` });
        }
      }

      // Validate Duration
      if (!durationVal) {
        errors.push({ row: rowNum, message: "Missing required field: Duration (Years)" });
      } else if (isNaN(duration) || duration <= 0) {
        errors.push({ row: rowNum, message: `Invalid duration '${durationVal}'. Must be a positive number.` });
      }

      // Validate Grading System
      const validGradingTypes = ['Normal', 'CBCE', 'Non-CBCE'];
      if (!validGradingTypes.includes(grading)) {
        errors.push({ row: rowNum, message: `Invalid grading system '${grading}'. Allowed types: Normal, CBCE, Non-CBCE` });
      }

      // Validate Electives Enabled
      const electives = electivesVal.startsWith('Y') || electivesVal.startsWith('T') || electivesVal === 'ACTIVE' || electivesVal === 'ENABLED' ? 'Y' : 'N';

      // Parse Associated Departments
      const unresolvedDepts = [];
      const resolvedDeptIds = [];
      if (deptsVal) {
        const parts = deptsVal.toString().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        for (const part of parts) {
          if (deptMap[part]) {
            resolvedDeptIds.push(deptMap[part]);
          } else {
            unresolvedDepts.push(part);
          }
        }
      }
      if (unresolvedDepts.length > 0) {
        errors.push({ row: rowNum, message: `Associated Department(s) not found: ${unresolvedDepts.join(', ')}` });
      }

      validatedRows.push({
        name: progName,
        code: progCode || `PRG-${Date.now().toString().slice(-6)}-${i}`,
        duration_years: duration,
        section_name: section || null,
        grading_system_type: grading,
        enable_elective_subjects_selection: electives,
        resolvedDeptIds
      });
    }

    if (errors.length > 0) {
      console.log('Bulk upload program validation errors:', errors);
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const row of validatedRows) {
        const insertRes = await dbClient.query(
          `INSERT INTO master_programs (name, duration_years, section_name, code, grading_system_type, enable_elective_subjects_selection, status, university_id) 
           VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7) RETURNING id`,
          [row.name, row.duration_years, row.section_name, row.code, row.grading_system_type, row.enable_elective_subjects_selection, targetUniId]
        );

        const programId = insertRes.rows[0].id;

        // Insert Department links
        for (const deptId of row.resolvedDeptIds) {
          await dbClient.query(
            "INSERT INTO master_program_departments (program_id, department_id) VALUES ($1, $2)",
            [programId, deptId]
          );
        }

        // Map program to university
        if (targetUniId) {
          await dbClient.query(
            "INSERT INTO university_master_programs (university_id, program_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [targetUniId, programId]
          );
        }
      }

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${programs.length} programs.`, successes: programs.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload programs error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Program API

// Start: Bulk Academic Year API
const bulkUploadAcademicYears = async (req, res) => {
  try {
    const academicYears = req.body.AcademicYear;
    if (!academicYears || !Array.isArray(academicYears) || academicYears.length === 0) {
      return res.status(400).json({ message: "Invalid academic year payload" });
    }

    const { role, university_id: userUniId } = req.user || {};
    const college_id = req.user?.college_id || req.user?.collegeId || null;

    let targetUniId = userUniId;
    if (!targetUniId && role === 'college_admin' && college_id) {
      const collegeRes = await client.query('SELECT university_id FROM colleges WHERE id = $1', [college_id]);
      if (collegeRes.rows.length > 0) {
        targetUniId = collegeRes.rows[0].university_id;
      }
    }

    // Pre-fetch existing academic years for fast duplicate detection
    const existingRes = await client.query('SELECT year_name FROM public.master_academic_years');
    const existingNamesSet = new Set();
    existingRes.rows.forEach(row => {
      if (row.year_name) existingNamesSet.add(row.year_name.toString().trim().toLowerCase());
    });

    // Phase 1: Validate
    let errors = [];
    const namesInBatch = new Set();
    const validatedRows = [];

    for (let i = 0; i < academicYears.length; i++) {
      const ay = academicYears[i];
      const rowNum = i + 2; // Rows start from 2 (excluding header)
      
      const yearName = (ay['Session Name'] || ay['year_name'] || '').toString().trim();

      // Validate Academic Year Name
      if (!yearName) {
        errors.push({ row: rowNum, message: "Missing required field: Session Name" });
      } else {
        const formatRegex = /^\d{4}-\d{4}$/;
        if (!formatRegex.test(yearName)) {
          errors.push({ row: rowNum, message: `Invalid session name format '${yearName}'. Expected format like '2024-2025'.` });
        } else {
          const [start, end] = yearName.split('-').map(Number);
          if (start >= end) {
            errors.push({ row: rowNum, message: `Invalid session name '${yearName}'. Start year must be less than end year.` });
          }
        }

        const cleanNameVal = yearName.toLowerCase();
        if (namesInBatch.has(cleanNameVal)) {
          errors.push({ row: rowNum, message: `Duplicate session name '${yearName}' found in the upload file.` });
        } else {
          namesInBatch.add(cleanNameVal);
        }
        if (existingNamesSet.has(cleanNameVal)) {
          errors.push({ row: rowNum, message: `Academic year '${yearName}' already exists.` });
        }
      }

      validatedRows.push({
        year_name: yearName
      });
    }

    if (errors.length > 0) {
      console.log('Bulk upload academic year validation errors:', errors);
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const row of validatedRows) {
        const insertRes = await dbClient.query(
          `INSERT INTO master_academic_years (year_name, created_at, deleteflag) 
           VALUES ($1, CURRENT_TIMESTAMP, true) RETURNING id`,
          [row.year_name]
        );

        const academicYearId = insertRes.rows[0].id;

        // Map academic year to university
        if (targetUniId) {
          await dbClient.query(
            "INSERT INTO university_master_academic_years (university_id, academic_year_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [targetUniId, academicYearId]
          );
        }
      }

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${academicYears.length} academic years.`, successes: academicYears.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload academic years error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Academic Year API

// Start: Bulk Semester API
const bulkUploadSemesters = async (req, res) => {
  try {
    const semesters = req.body.Semester;
    if (!semesters || !Array.isArray(semesters) || semesters.length === 0) {
      return res.status(400).json({ message: "Invalid semester payload" });
    }

    const { role, university_id: userUniId } = req.user || {};
    const college_id = req.user?.college_id || req.user?.collegeId || null;

    let targetUniId = userUniId;
    if (!targetUniId && role === 'college_admin' && college_id) {
      const collegeRes = await client.query('SELECT university_id FROM colleges WHERE id = $1', [college_id]);
      if (collegeRes.rows.length > 0) {
        targetUniId = collegeRes.rows[0].university_id;
      }
    }

    // Pre-fetch existing semesters for fast duplicate detection
    const existingRes = await client.query('SELECT semester_name FROM public.master_semesters');
    const existingNamesSet = new Set();
    existingRes.rows.forEach(row => {
      if (row.semester_name) existingNamesSet.add(row.semester_name.toString().trim().toLowerCase());
    });

    // Phase 1: Validate
    let errors = [];
    const namesInBatch = new Set();
    const validatedRows = [];

    for (let i = 0; i < semesters.length; i++) {
      const s = semesters[i];
      const rowNum = i + 2; // Rows start from 2 (excluding header)
      
      const semName = (s['Semester Title'] || s['semester_name'] || '').toString().trim();

      // Validate Semester Name
      if (!semName) {
        errors.push({ row: rowNum, message: "Missing required field: Semester Title" });
      } else {
        const cleanNameVal = semName.toLowerCase();
        if (namesInBatch.has(cleanNameVal)) {
          errors.push({ row: rowNum, message: `Duplicate semester name '${semName}' found in the upload file.` });
        } else {
          namesInBatch.add(cleanNameVal);
        }
        if (existingNamesSet.has(cleanNameVal)) {
          errors.push({ row: rowNum, message: `Semester '${semName}' already exists.` });
        }
      }

      validatedRows.push({
        semester_name: semName
      });
    }

    if (errors.length > 0) {
      console.log('Bulk upload semester validation errors:', errors);
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const row of validatedRows) {
        const insertRes = await dbClient.query(
          `INSERT INTO master_semesters (semester_name, status) 
           VALUES ($1, 'Active') RETURNING id`,
          [row.semester_name]
        );

        const semesterId = insertRes.rows[0].id;

        // Map semester to university
        if (targetUniId) {
          await dbClient.query(
            "INSERT INTO university_master_semesters (university_id, semester_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [targetUniId, semesterId]
          );
        }
      }

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${semesters.length} semesters.`, successes: semesters.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload semesters error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Semester API

// Start: Bulk Batch API
const bulkUploadBatches = async (req, res) => {
  try {
    const batches = req.body.Batch;
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({ message: "Invalid batch payload" });
    }

    const parseAndFormatDate = (dateStr) => {
      if (!dateStr) return null;
      const cleanStr = dateStr.toString().trim();
      const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (ymdRegex.test(cleanStr)) {
        return cleanStr;
      }
      
      const d = new Date(cleanStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      
      const parts = cleanStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (month > 12 && day <= 12) {
            const tmp = day;
            day = month;
            month = tmp;
          }
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
      return cleanStr;
    };

    // Pre-fetch programs for name mapping
    const programRes = await client.query('SELECT id, name FROM public.master_programs');
    const programMap = {};
    programRes.rows.forEach(row => {
      if (row.name) programMap[row.name.toString().trim().toLowerCase()] = row.id;
    });

    // Pre-fetch policies for name mapping
    const policyRes = await client.query('SELECT id, name FROM public.master_policies');
    const policyMap = {};
    policyRes.rows.forEach(row => {
      if (row.name) policyMap[row.name.toString().trim().toLowerCase()] = row.id;
    });

    // Pre-fetch existing batches for duplicate check (composite key: batch_name + program_id)
    const existingRes = await client.query('SELECT batch_name, program_id FROM public.master_batches');
    const existingBatchesSet = new Set();
    existingRes.rows.forEach(row => {
      if (row.batch_name && row.program_id) {
        existingBatchesSet.add(`${row.batch_name.toString().trim().toLowerCase()}_${row.program_id}`);
      }
    });

    // Phase 1: Validate
    let errors = [];
    const namesInBatch = new Set();
    const validatedRows = [];

    for (let i = 0; i < batches.length; i++) {
      const b = batches[i];
      const rowNum = i + 2; // Rows start from 2 (excluding header)
      
      const batchName = (b['Batch Name'] || b['batch_name'] || '').toString().trim();
      const rawStartDate = b['Start Date'] || b['start_date'] || '';
      const rawEndDate = b['End Date'] || b['end_date'] || '';
      const startDate = parseAndFormatDate(rawStartDate);
      const endDate = parseAndFormatDate(rawEndDate);
      const academicYear = (b['Academic Year'] || b['academic_year'] || '').toString().trim();
      const importFeesFlag = (b['Fees Import Flag'] || b['import_fees_flag'] || 'N').toString().trim().toUpperCase();
      const progName = (b['Program'] || b['program_name'] || '').toString().trim();
      const polName = (b['Policy'] || b['policy_name'] || '').toString().trim();
      const startYearVal = b['Start Year'] || b['start_year'];
      const endYearVal = b['End Year'] || b['end_year'];

      // Resolve Program
      let programId = null;
      if (progName) {
        const cleanProg = progName.toLowerCase();
        if (programMap[cleanProg]) {
          programId = programMap[cleanProg];
        } else {
          errors.push({ row: rowNum, message: `Program '${progName}' not found in master catalog.` });
        }
      } else {
        errors.push({ row: rowNum, message: "Missing required field: Program" });
      }

      // Validate Batch Name (Uniqueness is checked across Batch + Program)
      if (!batchName) {
        errors.push({ row: rowNum, message: "Missing required field: Batch Name" });
      } else if (programId) {
        const cleanNameVal = batchName.toLowerCase();
        const uniqueKey = `${cleanNameVal}_${programId}`;
        if (namesInBatch.has(uniqueKey)) {
          errors.push({ row: rowNum, message: `Duplicate batch name '${batchName}' for program '${progName}' found in the upload file.` });
        } else {
          namesInBatch.add(uniqueKey);
        }
        if (existingBatchesSet.has(uniqueKey)) {
          errors.push({ row: rowNum, message: `Batch '${batchName}' already exists for program '${progName}'.` });
        }
      }

      // Resolve Policy
      let policyId = null;
      if (polName) {
        const cleanPol = polName.toLowerCase();
        if (policyMap[cleanPol]) {
          policyId = policyMap[cleanPol];
        } else {
          errors.push({ row: rowNum, message: `Policy '${polName}' not found in master catalog.` });
        }
      }

      // Validate Dates
      if (!startDate) {
        errors.push({ row: rowNum, message: "Missing required field: Start Date" });
      }
      if (!endDate) {
        errors.push({ row: rowNum, message: "Missing required field: End Date" });
      }

      // Validate Fees Flag
      const feesFlag = importFeesFlag === 'Y' || importFeesFlag === 'YES' || importFeesFlag === 'TRUE' ? 'Y' : 'N';

      const parsedStartYear = (startYearVal && !isNaN(parseInt(startYearVal))) ? parseInt(startYearVal) : null;
      const parsedEndYear = (endYearVal && !isNaN(parseInt(endYearVal))) ? parseInt(endYearVal) : null;

      validatedRows.push({
        batch_name: batchName,
        start_date: startDate || null,
        end_date: endDate || null,
        academic_year: academicYear || batchName,
        import_fees_flag: feesFlag,
        program_id: programId,
        policy_id: policyId,
        start_year: parsedStartYear,
        end_year: parsedEndYear
      });
    }

    if (errors.length > 0) {
      console.log('Bulk upload batch validation errors:', errors);
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert inside transaction
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const row of validatedRows) {
        await dbClient.query(
          `INSERT INTO master_batches (batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active')`,
          [row.batch_name, row.start_date, row.end_date, row.academic_year, row.import_fees_flag, row.program_id, row.policy_id, row.start_year, row.end_year]
        );
      }

      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${batches.length} batches.`, successes: batches.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload batches error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Batch API

// Start: Bulk University API
const bulkUploadUniversities = async (req, res) => {
  try {
    const { universities } = req.body;
    if (!universities || !Array.isArray(universities) || universities.length === 0) {
      return res.status(400).json({ message: "Invalid university payload" });
    }

    // Phase 1: Validate
    let errors = [];
    const namesInBatch = new Set();

    for (let i = 0; i < universities.length; i++) {
      const u = universities[i];
      const rowNum = i + 1;
      if (!u.name || !u.name.trim()) {
        errors.push({ row: rowNum, message: "Missing required field: name" });
      } else {
        const cleanName = u.name.trim().toLowerCase();
        if (namesInBatch.has(cleanName)) {
          errors.push({ row: rowNum, message: `Duplicate name '${u.name}' found in the upload file.` });
        }
        namesInBatch.add(cleanName);

        // Check DB for existing university with this name
        const checkRes = await client.query('SELECT id FROM public.universities WHERE LOWER(TRIM(name)) = $1', [cleanName]);
        if (checkRes.rows.length > 0) {
          errors.push({ row: rowNum, message: `University with name '${u.name}' already exists.` });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const u of universities) {
        const name = u.name.trim();
        const address = u.address ? u.address.trim() : null;
        const status = u.status === undefined ? true : (u.status === 'false' || u.status === false ? false : true);
        const university_type = u.university_type ? u.university_type.trim() : null;

        const uRes = await dbClient.query(
          'INSERT INTO public.universities (name, address, status, university_type) VALUES ($1, $2, $3, $4) RETURNING id',
          [name, address, status, university_type]
        );
        const uId = uRes.rows[0].id;

        // Also create matching default college
        await dbClient.query(
          'INSERT INTO public.colleges (name, university_id, address, status) VALUES ($1, $2, $3, $4)',
          [name, uId, address, status]
        );
      }
      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${universities.length} universities.`, successes: universities.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload universities error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};

// Start: Bulk College API
const bulkUploadColleges = async (req, res) => {
  try {
    const { colleges } = req.body;
    if (!colleges || !Array.isArray(colleges) || colleges.length === 0) {
      return res.status(400).json({ message: "Invalid college payload" });
    }

    // Phase 1: Validate
    let errors = [];
    const namesInBatch = new Set();
    const codesInBatch = new Set();

    for (let i = 0; i < colleges.length; i++) {
      const c = colleges[i];
      const rowNum = i + 1;

      if (!c.name || !c.name.trim()) {
        errors.push({ row: rowNum, message: "Missing required field: name" });
      } else {
        const cleanName = c.name.trim().toLowerCase();
        if (namesInBatch.has(cleanName)) {
          errors.push({ row: rowNum, message: `Duplicate name '${c.name}' found in the upload file.` });
        }
        namesInBatch.add(cleanName);

        // Check DB for existing college with this name
        const checkRes = await client.query('SELECT id FROM public.colleges WHERE LOWER(TRIM(name)) = $1', [cleanName]);
        if (checkRes.rows.length > 0) {
          errors.push({ row: rowNum, message: `College with name '${c.name}' already exists.` });
        }
      }

      if (c.college_code) {
        const cleanCode = c.college_code.toString().trim().toUpperCase();
        if (cleanCode !== '') {
          if (codesInBatch.has(cleanCode)) {
            errors.push({ row: rowNum, message: `Duplicate college code '${c.college_code}' found in the upload file.` });
          }
          codesInBatch.add(cleanCode);

          // Check DB for existing college code (cast to text in case stored as integer)
          const checkCode = await client.query('SELECT id FROM public.colleges WHERE UPPER(TRIM(college_code::TEXT)) = $1', [cleanCode]);
          if (checkCode.rows.length > 0) {
            errors.push({ row: rowNum, message: `College code '${c.college_code}' already exists.` });
          }
        }
      }

      // Check university
      if (!c.university_id && !c.university_name) {
        errors.push({ row: rowNum, message: "Missing required field: university_id or university_name" });
      } else {
        let uId = c.university_id;
        if (!uId && c.university_name) {
          const uName = c.university_name.trim();
          const uRes = await client.query('SELECT id FROM public.universities WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [uName]);
          if (uRes.rows.length === 0) {
            errors.push({ row: rowNum, message: `University '${c.university_name}' not found in the database.` });
          }
        } else if (uId) {
          const uRes = await client.query('SELECT id FROM public.universities WHERE id = $1', [uId]);
          if (uRes.rows.length === 0) {
            errors.push({ row: rowNum, message: `University ID ${uId} not found in the database.` });
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    // Phase 2: Insert
    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const c of colleges) {
        const name = c.name.trim();
        const college_code = c.college_code ? c.college_code.toString().trim() : null;
        const address = c.address ? c.address.trim() : null;
        const status = c.status === undefined ? true : (c.status === 'false' || c.status === false ? false : true);
        const latitude = c.latitude ? parseFloat(c.latitude) : null;
        const longitude = c.longitude ? parseFloat(c.longitude) : null;

        let university_id = c.university_id;
        if (!university_id && c.university_name) {
          const uRes = await dbClient.query('SELECT id FROM public.universities WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [c.university_name.trim()]);
          university_id = uRes.rows[0].id;
        }

        await dbClient.query(
          'INSERT INTO public.colleges (name, college_code, university_id, address, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [name, college_code, university_id, address, status, latitude, longitude]
        );
      }
      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${colleges.length} colleges.`, successes: colleges.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload colleges error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
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

    const numericId = parseInt(id);
    const isInternalSchedule = numericId >= 1000000;
    const realId = isInternalSchedule ? numericId - 1000000 : numericId;

    const checkResult = await client.query(
      `SELECT e.college_id, e.exam_type, e.subject_id, e.name, e.semester_id, c.university_id 
       FROM exams e 
       LEFT JOIN colleges c ON e.college_id = c.id
       WHERE e.id = $1`,
      [realId]
    );
    if (checkResult.rows.length === 0) return res.status(404).json({ message: "Exam not found" });

    const exam = checkResult.rows[0];
    const universityId = exam.university_id || req.user.university_id;

    if (role === 'college_admin' && exam.college_id != userCollegeId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // For internal exams (type 1): ALL subjects in the series must be Locked before publishing any
    if (results_published && exam.exam_type == 1) {
      // Get all subjects in this exam series (same name + college + semester)
      const seriesRes = await client.query(
        `SELECT e.id, e.subject_id, sub.name as subject_name,
                COALESCE(mws.status, 'Not Submitted') as lock_status
         FROM exams e
         JOIN master_subjects sub ON e.subject_id = sub.id
         LEFT JOIN marks_workflow_status mws 
           ON mws.subject_id = e.subject_id AND mws.college_id = e.college_id
         WHERE e.name = $1 AND e.college_id = $2 AND e.semester_id = $3`,
        [exam.name, exam.college_id, exam.semester_id]
      );

      const unlockedSubjects = seriesRes.rows.filter(r => r.lock_status !== 'Locked');
      if (unlockedSubjects.length > 0) {
        const names = unlockedSubjects.map(r => `${r.subject_name} (${r.lock_status})`).join(', ');
        return res.status(400).json({
          message: `Cannot publish results: ${unlockedSubjects.length} subject(s) in this series are not locked yet: ${names}. Please lock ALL subjects via Verify & Lock first.`
        });
      }
    }

    // For external exams (type 2): Check if external marks are submitted.
    // Internal marks check is bypassed to allow university admins to publish results once external evaluations are complete.
    if (results_published && exam.exam_type == 2) {
      const seriesRes = await client.query(
        `SELECT e.id, sub.name as subject_name,
                    (
                        EXISTS (
                            SELECT 1 FROM external_faculty_assignments efa
                            WHERE efa.exam_id = e.id AND (efa.subject_id = e.subject_id OR efa.subject_id IS NULL) 
                              AND efa.status IN ('Submitted', 'Approved', 'Finalized')
                        )
                        OR
                        EXISTS (
                            SELECT 1 FROM marks m 
                            WHERE m.exam_id = e.id AND m.external_marks IS NOT NULL
                        )
                    ) as is_external_submitted
             FROM exams e
             JOIN master_subjects sub ON e.subject_id = sub.id
             WHERE e.name = $1 AND e.semester_id = $2 AND e.program_id = (SELECT program_id FROM exams WHERE id = $3)`,
        [exam.name, exam.semester_id, realId]
      );

      const unready = seriesRes.rows.filter(r => !r.is_external_submitted);
      if (unready.length > 0) {
        const externalPending = unready.map(r => r.subject_name);
        return res.status(400).json({
          message: `Cannot publish results: External marks pending for: ${externalPending.join(', ')}`
        });
      }
    }

    // Apply Grace Marks if publishing
    if (results_published) {
      console.log(`[GRACE] Processing grace marks for series: ${exam.name}`);
      const studentsRes = await client.query(
        `SELECT DISTINCT student_id FROM marks m
             JOIN exams e ON m.exam_id = e.id
             WHERE e.name = $1 AND e.semester_id = $2`,
        [exam.name, exam.semester_id]
      );
      for (const row of studentsRes.rows) {
        await applyGraceMarks(row.student_id, exam.name, universityId, req.user.id, client);
      }
    }

    const result = await client.query(
      "UPDATE exams SET results_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [results_published, realId]
    );
    res.json({ message: `Results ${results_published ? 'published' : 'unpublished'} successfully`, data: result.rows[0] });
    logger.info(`Results ${results_published ? 'published' : 'unpublished'} for series: ${series_name}`);
  } catch (error) {
    logger.error("publishResults failure", { series_name, semester_id, results_published }, error);
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
      WITH ia_ranked AS (
          SELECT 
              sim_ia.student_id, 
              sim_ia.subject_id, 
              sim_ia.marks_obtained::float as marks,
              ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
          FROM student_internal_marks sim_ia
          JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
          WHERE ims_ia.component_name ILIKE 'IA%'
      ),
      ia_summary AS (
          SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
          FROM ia_ranked ir
          WHERE ir.rnk <= 2
          GROUP BY ir.student_id, ir.subject_id
      ),
      other_summary AS (
          SELECT 
              sim_o.student_id, 
              sim_o.subject_id, 
              SUM(sim_o.marks_obtained::float) as other_total
          FROM student_internal_marks sim_o
          JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
          WHERE ims_o.component_name NOT ILIKE 'IA%' 
            AND ims_o.component_name NOT ILIKE 'TOTAL%'
            AND ims_o.component_name NOT ILIKE 'BEST_OF_3%'
          GROUP BY sim_o.student_id, sim_o.subject_id
      ),
      raw_internal_totals AS (
          SELECT 
              COALESCE(i.student_id, o.student_id) as student_id,
              COALESCE(i.subject_id, o.subject_id) as subject_id,
              (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw,
              MAX(mws2.status) as batch_status
          FROM ia_summary i
          FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
          JOIN students s2 ON COALESCE(i.student_id, o.student_id) = s2.id
          JOIN colleges c2 ON LOWER(s2."collageName") = LOWER(c2.name)
          JOIN master_subjects sub2 ON COALESCE(i.subject_id, o.subject_id) = sub2.id
          LEFT JOIN marks_workflow_status mws2 ON COALESCE(i.subject_id, o.subject_id) = mws2.subject_id 
              AND mws2.college_id = c2.id 
              AND mws2.semester_id = sub2.semester_id
          LEFT JOIN component_acceptance ca ON ca.college_id = c2.id 
              AND ca.subject_id = COALESCE(i.subject_id, o.subject_id)
          WHERE (mws2.status IN ('Approved', 'Locked') OR ca.is_accepted = true)
          GROUP BY COALESCE(i.student_id, o.student_id), COALESCE(i.subject_id, o.subject_id), i.ia_total, o.other_total
      ),
      raw_internal AS (
          SELECT 
              t.*,
              (
                  SELECT json_agg(json_build_object(
                      'name', ims_inner.component_name,
                      'marks', sim_inner.marks_obtained::float
                  ))
                  FROM student_internal_marks sim_inner
                  JOIN internal_marks_structure ims_inner ON sim_inner.component_id = ims_inner.id
                  WHERE sim_inner.student_id = t.student_id 
                    AND sim_inner.subject_id = t.subject_id
                    AND ims_inner.component_name NOT ILIKE 'TOTAL%'
                    AND ims_inner.component_name NOT ILIKE 'BEST_OF_3%'
              ) as components
          FROM raw_internal_totals t
      )
      
      SELECT 
        COALESCE(m.id, 0) as mark_id,
        e.exam_type,
        COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks,
        COALESCE(m.external_marks, 0) as external_marks,
        COALESCE(e.moderation_marks, 0) as moderation_marks,
        COALESCE(m.grace_marks, 0) as grace_marks,
        (
            COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + 
            COALESCE(m.external_marks, 0) + 
            COALESCE(e.moderation_marks, 0) + 
            COALESCE(m.grace_marks, 0)
        ) as total_marks,
        COALESCE(m.status, 'Internal Only') as result_status,
        e.name as exam_name,
        e.id as exam_id,
        sub.name as subject_name,
        sub.id as subject_id,
        sub.subject_code,
        sub.credit as credits,
        p.name as program_name,
        sem.semester_name,
        s."collageName" as college_name,
        raw_internal.batch_status as batch_status,
        raw_internal.components as assessment_components
      FROM students s
      JOIN master_programs p ON s."programName" = p.name
      LEFT JOIN colleges c ON LOWER(c.name) = LOWER(s."collageName")
      JOIN exams e ON e.program_id = p.id 
          AND (e.college_id = c.id OR (e.college_id IS NULL AND e.exam_type = 2))
      JOIN master_semesters sem ON e.semester_id = sem.id
      JOIN master_subjects sub ON e.subject_id = sub.id
      LEFT JOIN marks m ON m.exam_id = e.id AND m.student_id = s.id
      LEFT JOIN calculated_internal_marks cim ON s.id = cim.student_id 
          AND (cim.subject_id = e.subject_id OR cim.subject_id = sub.id)
      LEFT JOIN raw_internal ON s.id = raw_internal.student_id AND sub.id = raw_internal.subject_id
      WHERE s.id = $1 AND e.results_published = true AND e.exam_type = 2
        AND m.status IN ('Pass', 'Fail', 'Finalized', 'Approved', 'Pending Approval', 'Draft', 'Internal Only')

      UNION ALL

      SELECT 
        0 as mark_id,
        1 as exam_type,
        raw_internal.total_raw as internal_marks,
        0 as external_marks,
        0 as moderation_marks,
        0 as grace_marks,
        raw_internal.total_raw as total_marks,
        raw_internal.batch_status as result_status,
        sem.semester_name || ' Internal Assessments' as exam_name,
        0 as exam_id,
        sub.name as subject_name,
        sub.id as subject_id,
        sub.subject_code,
        sub.credit as credits,
        p.name as program_name,
        sem.semester_name,
        s."collageName" as college_name,
        raw_internal.batch_status as batch_status,
        raw_internal.components as assessment_components
      FROM students s
      JOIN master_programs p ON s."programName" = p.name
      JOIN raw_internal ON s.id = raw_internal.student_id
      JOIN master_subjects sub ON raw_internal.subject_id = sub.id
      LEFT JOIN (
          SELECT DISTINCT subject_id, semester_id 
          FROM faculty_subjects
      ) fs_sem ON fs_sem.subject_id = raw_internal.subject_id
      JOIN master_semesters sem ON fs_sem.semester_id = sem.id
      WHERE s.id = $1 AND raw_internal.total_raw IS NOT NULL
      
      ORDER BY exam_type ASC, subject_name ASC
    `;

    const result = await client.query(query, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student results error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find student record for this user
    const studentRes = await client.query('SELECT id, "collageName", "programName", semister, department FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const student = studentRes.rows[0];

    // Clean up input names
    const colName = student.collageName?.trim();
    const progName = student.programName?.trim();
    const semName = student.semister?.trim();
    const deptName = student.department?.trim();

    // Find College, Program, and Semester IDs
    const colRes = await client.query('SELECT id FROM colleges WHERE name ILIKE $1', [colName]);
    const progRes = await client.query('SELECT id FROM master_programs WHERE name ILIKE $1', [progName]);

    let semesterId;
    if (req.query.semester_id) {
      semesterId = parseInt(req.query.semester_id);
    } else {
      // Robust semester matching: handle "3" vs "Semester 3" vs "III Semester"
      let semRes = await client.query('SELECT id, semester_name FROM master_semesters WHERE semester_name ILIKE $1', [semName]);
      if (semRes.rows.length === 0) {
        // Try adding "Semester " prefix if it was just a number
        semRes = await client.query('SELECT id, semester_name FROM master_semesters WHERE semester_name ILIKE $1 OR semester_name ILIKE $2', [`Semester ${semName}`, `%${semName}%`]);
      }
      if (semRes.rows.length > 0) {
        semesterId = semRes.rows[0].id;
      }
    }

    if (colRes.rows.length === 0 || progRes.rows.length === 0 || !semesterId) {
      console.warn(`[Attendance] Academic profile mismatch for user ${userId}:`, {
        college: colName, foundCol: colRes.rowCount > 0,
        program: progName, foundProg: progRes.rowCount > 0,
        semesterId: semesterId
      });
      return res.status(200).json([]); // Return empty list instead of 400 to avoid UI crashes
    }

    const collegeId = colRes.rows[0].id;
    const programId = progRes.rows[0].id;

    // Resolve department ID from student's department code
    let departmentId = null;
    if (deptName) {
      const deptRes = await client.query('SELECT id FROM master_departments WHERE department_code = $1 AND college_id = $2', [deptName, collegeId]);
      if (deptRes.rows.length > 0) {
        departmentId = deptRes.rows[0].id;
      }
    }

    const query = `
      WITH total_sessions AS (
        SELECT 
          subject_id, 
          COUNT(DISTINCT (attendance_date, period_number, section)) as total_sessions
        FROM student_attendance
        WHERE college_id = $1 AND semester_id = $2
        GROUP BY subject_id
      ),
      student_present AS (
        SELECT 
          subject_id, 
          COUNT(*) as present_count
        FROM student_attendance
        WHERE student_id = $3 AND status = 'Present' AND semester_id = $2
        GROUP BY subject_id
      )
      SELECT 
        sub.id as subject_id,
        sub.name as subject_name,
        sub.subject_code,
        COALESCE(ts.total_sessions, 0) as total_sessions,
        COALESCE(sp.present_count, 0) as attended_sessions,
        CASE 
          WHEN COALESCE(ts.total_sessions, 0) > 0 
          THEN ROUND((COALESCE(sp.present_count, 0)::numeric / ts.total_sessions::numeric) * 100, 2)
          -- Default to 100% if no sessions have been taken yet (for Semester 1-3)
          WHEN $2 IN (SELECT id FROM master_semesters WHERE semester_name ILIKE '%1%' OR semester_name ILIKE '%2%' OR semester_name ILIKE '%3%')
          THEN 100
          ELSE 0 
        END as attendance_percentage
      FROM master_subjects sub
      LEFT JOIN policy_program_subjects pps ON sub.id = pps.subject_id 
        AND pps.college_id = $1 
        AND pps.semester_id = $2 
        AND pps.program_id = $4
        AND ($5::integer IS NULL OR pps.department_id = $5 OR pps.department_id IS NULL)
      LEFT JOIN total_sessions ts ON sub.id = ts.subject_id
      LEFT JOIN student_present sp ON sub.id = sp.subject_id
      WHERE pps.subject_id IS NOT NULL OR sp.subject_id IS NOT NULL
      ORDER BY sub.name
    `;

    const result = await client.query(query, [collegeId, semesterId, student.id, programId, departmentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student attendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getStudentAttendanceDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;

    // Find student record for this user
    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const studentId = studentRes.rows[0].id;

    const query = `
      SELECT 
        attendance_date, 
        period_number, 
        status, 
        section
      FROM student_attendance
      WHERE student_id = $1 AND subject_id = $2
      ORDER BY attendance_date DESC, period_number DESC
    `;

    const result = await client.query(query, [studentId, subjectId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student attendance detail error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getStudentAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find student record for this user
    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const studentId = studentRes.rows[0].id;

    const query = `
      SELECT 
        sa.attendance_date, 
        sa.period_number, 
        sa.status, 
        sa.section,
        sub.name as subject_name,
        sub.subject_code
      FROM student_attendance sa
      JOIN master_subjects sub ON sa.subject_id = sub.id
      WHERE sa.student_id = $1
      ORDER BY sa.attendance_date DESC, sa.period_number DESC
    `;

    const result = await client.query(query, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student attendance history error:", error);
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

const submitMarksDiscrepancy = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, component_name, message } = req.body;

    if (!subject_id || !component_name || !message) {
      return res.status(400).json({ message: "Missing required fields: subject_id, component_name, message" });
    }

    // Find student record for this user
    const studentRes = await client.query('SELECT id, "collageName", semister FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const student = studentRes.rows[0];

    // Find college and semester to store robust metadata
    const colRes = await client.query('SELECT id FROM colleges WHERE name ILIKE $1', [student.collageName]);
    const semRes = await client.query('SELECT id FROM master_semesters WHERE semester_name ILIKE $1 OR semester_name ILIKE $2', [student.semister, `%${student.semister}%`]);

    const collegeId = colRes.rows.length > 0 ? colRes.rows[0].id : null;
    const semesterId = semRes.rows.length > 0 ? semRes.rows[0].id : null;

    // Check if HOD has approved the marks for this subject — block correction requests if so
    if (collegeId && semesterId) {
      const approvalCheck = await client.query(
        `SELECT status FROM marks_workflow_status 
         WHERE subject_id = $1 AND college_id = $2 AND semester_id = $3 AND status = 'Approved'`,
        [subject_id, collegeId, semesterId]
      );
      if (approvalCheck.rows.length > 0) {
        return res.status(403).json({ message: "Cannot raise correction requests. The internal assessment marks have already been approved by the HOD." });
      }
    }

    // Check if there is already a pending discrepancy for this student, subject, and component
    const checkRes = await client.query(
      `SELECT id FROM student_mark_discrepancies 
       WHERE student_id = $1 AND subject_id = $2 AND component_name = $3 AND status = 'Pending'`,
      [student.id, subject_id, component_name]
    );

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ message: "You have already reported a pending issue for this component. Please wait for the faculty to review." });
    }

    await client.query(
      `INSERT INTO student_mark_discrepancies (student_id, subject_id, college_id, semester_id, component_name, message, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
      [student.id, subject_id, collegeId, semesterId, component_name, message]
    );

    res.status(201).json({ message: "Discrepancy reported successfully" });
  } catch (error) {
    console.error("Submit marks discrepancy error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getStudentDiscrepancies = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find student record for this user
    const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found" });
    const studentId = studentRes.rows[0].id;

    const query = `
      SELECT 
        smd.id,
        smd.subject_id,
        smd.component_name,
        smd.message,
        smd.status,
        smd.created_at,
        sub.name as subject_name,
        sub.subject_code
      FROM student_mark_discrepancies smd
      JOIN master_subjects sub ON smd.subject_id = sub.id
      WHERE smd.student_id = $1
      ORDER BY smd.created_at DESC
    `;

    const result = await client.query(query, [studentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Get student discrepancies error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- INTERNAL EXAM ATTENDANCE MODULE ---

/**
 * GET /student/internal-exam-attendance
 * Returns the logged-in student's internal exam attendance grouped by semester.
 * Uses master_subjects.semester_id which is always populated.
 */
const getStudentInternalExamAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentRes = await client.query(
      'SELECT id FROM students WHERE user_id = $1',
      [userId]
    );
    if (studentRes.rows.length === 0)
      return res.status(404).json({ message: 'Student record not found' });
    const studentId = studentRes.rows[0].id;

    const query = `
      SELECT
        ms.id            AS semester_id,
        ms.semester_name,
        sub.id           AS subject_id,
        sub.name         AS subject_name,
        sub.subject_code,
        ims.id           AS component_id,
        ims.component_name,
        sim.is_absent,
        sim.marks_obtained
      FROM student_internal_marks sim
      JOIN internal_marks_structure ims ON sim.component_id = ims.id
      JOIN master_subjects sub           ON sim.subject_id  = sub.id
      JOIN faculty_subjects fs           ON fs.subject_id = sim.subject_id AND fs.teacher_id = sim.entered_by_faculty_id
      JOIN master_semesters ms           ON fs.semester_id = ms.id
      WHERE sim.student_id = $1
        AND ims.component_name NOT ILIKE 'TOTAL%'
        AND ims.component_name NOT ILIKE 'BEST_OF_3%'
      ORDER BY ms.id ASC, sub.name ASC, ims.component_name ASC
    `;

    const result = await client.query(query, [studentId]);
    const rows = result.rows;

    const semesterMap = {};
    for (const row of rows) {
      const semKey = row.semester_name;
      if (!semesterMap[semKey]) {
        semesterMap[semKey] = { semester_name: semKey, subjects: {} };
      }
      const subKey = row.subject_id;
      if (!semesterMap[semKey].subjects[subKey]) {
        semesterMap[semKey].subjects[subKey] = {
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          subject_code: row.subject_code,
          components: []
        };
      }
      semesterMap[semKey].subjects[subKey].components.push({
        component_id: row.component_id,
        component_name: row.component_name,
        status: row.is_absent ? 'Absent' : 'Present',
        marks_obtained: row.marks_obtained
      });
    }

    const semesters = Object.values(semesterMap).map(sem => {
      const subjects = Object.values(sem.subjects).map(sub => {
        const total = sub.components.length;
        const present = sub.components.filter(c => c.status === 'Present').length;
        return {
          ...sub,
          total_components: total,
          present_count: present,
          absent_count: total - present,
          attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0
        };
      });
      const semTotal = subjects.reduce((a, s) => a + s.total_components, 0);
      const semPresent = subjects.reduce((a, s) => a + s.present_count, 0);
      return {
        semester_name: sem.semester_name,
        subjects,
        semester_total: semTotal,
        semester_present: semPresent,
        semester_absent: semTotal - semPresent,
        semester_percentage: semTotal > 0 ? Math.round((semPresent / semTotal) * 100) : 0
      };
    });

    res.json(semesters);
  } catch (error) {
    console.error('getStudentInternalExamAttendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /college-admin/internal-exam-attendance?semester_id=&subject_id=
 * Returns ALL students in a college for a given semester with their internal exam
 * present/absent status. Uses sub.semester_id — always reliable.
 */
const getAdminInternalExamAttendance = async (req, res) => {
  try {
    const { semester_id, subject_id } = req.query;
    const { college_id } = req.user;

    if (!semester_id) {
      return res.status(400).json({ message: 'semester_id is required' });
    }

    let query = `
      SELECT DISTINCT
        s.id               AS student_id,
        TRIM(s.name)       AS student_name,
        TRIM(s.rollnumber) AS enrollment_number,
        ms.semester_name,
        sub.id             AS subject_id,
        sub.name           AS subject_name,
        sub.subject_code,
        ims.component_name,
        sim.is_absent
      FROM student_internal_marks sim
      JOIN internal_marks_structure ims ON sim.component_id = ims.id
      JOIN master_subjects sub           ON sim.subject_id  = sub.id
      JOIN students s                    ON sim.student_id  = s.id
      JOIN colleges c                    ON LOWER(s."collageName") = LOWER(c.name)
      JOIN faculty_subjects fs           ON fs.subject_id = sim.subject_id AND fs.teacher_id = sim.entered_by_faculty_id
      JOIN master_semesters ms           ON fs.semester_id = ms.id
      WHERE ms.id = $1
        AND c.id = $2
        AND ims.component_name NOT ILIKE 'TOTAL%'
        AND ims.component_name NOT ILIKE 'BEST_OF_3%'
    `;
    const values = [semester_id, college_id];

    if (subject_id) {
      query += ` AND sim.subject_id = $3`;
      values.push(subject_id);
    }

    query += ` ORDER BY TRIM(s.rollnumber) ASC, sub.name ASC, ims.component_name ASC`;

    const result = await client.query(query, values);
    const rows = result.rows;

    const studentMap = {};
    for (const row of rows) {
      const sKey = row.student_id;
      if (!studentMap[sKey]) {
        studentMap[sKey] = {
          student_id: row.student_id,
          student_name: row.student_name,
          enrollment_number: row.enrollment_number,
          semester_name: row.semester_name,
          subjects: {}
        };
      }
      const subKey = row.subject_id;
      if (!studentMap[sKey].subjects[subKey]) {
        studentMap[sKey].subjects[subKey] = {
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          subject_code: row.subject_code,
          components: []
        };
      }
      studentMap[sKey].subjects[subKey].components.push({
        component_name: row.component_name,
        status: row.is_absent ? 'Absent' : 'Present'
      });
    }

    const students = Object.values(studentMap).map(stu => {
      const subjects = Object.values(stu.subjects).map(sub => {
        const total = sub.components.length;
        const present = sub.components.filter(c => c.status === 'Present').length;
        return { ...sub, total_components: total, present_count: present, absent_count: total - present, attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
      });
      const semTotal = subjects.reduce((a, s) => a + s.total_components, 0);
      const semPresent = subjects.reduce((a, s) => a + s.present_count, 0);
      return {
        ...stu,
        subjects,
        overall_total: semTotal,
        overall_present: semPresent,
        overall_absent: semTotal - semPresent,
        overall_percentage: semTotal > 0 ? Math.round((semPresent / semTotal) * 100) : 0
      };
    });

    res.json(students);
  } catch (error) {
    console.error('getAdminInternalExamAttendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /faculty/internal-exam-attendance
 * Returns each subject assigned to the faculty (across all semesters) with a
 * summary of how many students were Present/Absent per component.
 */
const getFacultyInternalExamAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Resolve the teacher record
    const teacherRes = await client.query(
      `SELECT mt.id, mt.college_id
       FROM master_teachers mt
       JOIN users u ON mt.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [userId]
    );
    if (teacherRes.rows.length === 0)
      return res.status(404).json({ message: 'Teacher record not found' });
    const { id: teacherId, college_id: collegeId } = teacherRes.rows[0];

    // Get all subjects assigned to this faculty across all semesters
    const assignedRes = await client.query(
      `SELECT DISTINCT fs.subject_id, fs.semester_id,
              sub.name        AS subject_name,
              sub.subject_code,
              ms.semester_name,
              ms.id AS ms_id
       FROM faculty_subjects fs
       JOIN master_subjects sub  ON fs.subject_id  = sub.id
       JOIN master_semesters ms  ON fs.semester_id = ms.id
       WHERE fs.teacher_id = $1
       ORDER BY ms.id ASC, sub.name ASC`,
      [teacherId]
    );

    if (assignedRes.rows.length === 0) return res.json([]);

    // For each assigned subject, get present/absent counts per component
    const results = [];
    for (const sub of assignedRes.rows) {
      const compRes = await client.query(
        `SELECT
           ims.component_name,
           COUNT(*)                                      AS total_students,
           COUNT(*) FILTER (WHERE sim.is_absent = false) AS present_count,
           COUNT(*) FILTER (WHERE sim.is_absent = true)  AS absent_count
         FROM student_internal_marks sim
         JOIN internal_marks_structure ims ON sim.component_id = ims.id
         WHERE sim.subject_id = $1
           AND ims.component_name NOT ILIKE 'TOTAL%'
           AND ims.component_name NOT ILIKE 'BEST_OF_3%'
         GROUP BY ims.component_name
         ORDER BY ims.component_name ASC`,
        [sub.subject_id]
      );

      const components = compRes.rows.map(r => ({
        component_name: r.component_name,
        total_students: parseInt(r.total_students),
        present_count: parseInt(r.present_count),
        absent_count: parseInt(r.absent_count),
        attendance_percentage: parseInt(r.total_students) > 0
          ? Math.round((parseInt(r.present_count) / parseInt(r.total_students)) * 100)
          : 0
      }));

      const grandTotal = components.reduce((a, c) => a + c.total_students, 0);
      const grandPresent = components.reduce((a, c) => a + c.present_count, 0);

      results.push({
        subject_id: sub.subject_id,
        subject_name: sub.subject_name,
        subject_code: sub.subject_code,
        semester_id: sub.semester_id,
        semester_name: sub.semester_name,
        components,
        total_entries: grandTotal,
        total_present: grandPresent,
        total_absent: grandTotal - grandPresent,
        overall_percentage: grandTotal > 0 ? Math.round((grandPresent / grandTotal) * 100) : 0
      });
    }

    res.json(results);
  } catch (error) {
    console.error('getFacultyInternalExamAttendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

    // Fetch all students in the same program+college who are active.
    // We intentionally do NOT filter by semister string here — the subject/exam context
    // already defines the semester scope. Students should always appear in their program's
    // roster across all semesters so promoted students remain visible historically.
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
        AND m.subject_id = $3 
        AND (m.exam_id = $4 OR $4 IS NULL)
        AND (m.academic_year_id = $5 OR $5 IS NULL)
      WHERE s."collageName" ILIKE $1 
        AND s."programName" ILIKE $2 
        AND s."deleteStatus" = true
      ORDER BY s.rollnumber ASC NULLS LAST, s.name ASC
    `;

    const values = [
      `%${collegeNameText}%`,
      `%${programNameText}%`,
      subject_id,
      exam_id || null,
      academic_year_id || null
    ];

    const result = await client.query(query, values);

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

const bulkUploadMarks = async (req, res) => {
  const dbClient = await client.connect();
  try {
    const { subject_id, exam_id, academic_year_id, marks } = req.body;

    if (!subject_id || !marks || !Array.isArray(marks)) {
      return res.status(400).json({ message: "Invalid payload. Subject and Marks data are required." });
    }

    const teacherCheck = await dbClient.query('SELECT id FROM teachers WHERE user_id = $1', [req.user.id]);
    const actual_teacher_id = teacherCheck.rows.length > 0 ? teacherCheck.rows[0].id : null;

    await dbClient.query("BEGIN");

    let errors = [];
    for (let i = 0; i < marks.length; i++) {
      const record = marks[i];
      const rowNum = i + 1;

      const enrollmentNo = record.enrollment_number || record.rollnumber;
      if (!enrollmentNo) {
        errors.push({ row: rowNum, message: "Missing Enrollment No / Roll Number" });
        continue;
      }

      // Lookup student_id by enrollment_number or rollnumber
      const studentRes = await dbClient.query('SELECT id FROM students WHERE TRIM(rollnumber) = $1 OR TRIM(enrollment_number) = $1', [enrollmentNo.toString().trim()]);
      if (studentRes.rows.length === 0) {
        errors.push({ row: rowNum, message: `Student with Enrollment No ${enrollmentNo} not found.` });
        continue;
      }
      const student_id = studentRes.rows[0].id;

      const internal = record.internal_marks !== undefined && record.internal_marks !== '' ? parseFloat(record.internal_marks) : null;
      const external = record.external_marks !== undefined && record.external_marks !== '' ? parseFloat(record.external_marks) : null;
      const computedTotal = (internal || 0) + (external || 0);
      const rowStatus = 'Draft';

      // Upsert logic
      const checkResult = await dbClient.query(
        `SELECT id FROM marks 
         WHERE student_id = $1 AND subject_id = $2 
         AND (exam_id = $3 OR ($3 IS NULL AND exam_id IS NULL))
         AND (academic_year_id = $4 OR ($4 IS NULL AND academic_year_id IS NULL))`,
        [student_id, subject_id, exam_id || null, academic_year_id || null]
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
          [student_id, subject_id, exam_id || null, academic_year_id || null, internal, external, computedTotal, rowStatus, actual_teacher_id]
        );
      }
    }

    if (errors.length > 0) {
      await dbClient.query("ROLLBACK");
      return res.status(400).json({ message: "Bulk upload failed due to validation errors.", errors });
    }

    await dbClient.query("COMMIT");
    res.json({ message: "Marks uploaded and upserted successfully." });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("Bulk upload marks error:", error);
    res.status(500).json({ message: "Failed to upload marks", error: error.message });
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

    const { program_id, semester_id, component_name } = req.query;
    const { college_id } = req.user || {};

    if (uId) {
      query += " AND ms.university_id = $" + (params.length + 1);
      params.push(uId);
    }
    if (program_id) {
      query += " AND ms.program_id = $" + (params.length + 1);
      params.push(program_id);
    }
    if (semester_id) {
      query += " AND ms.semester_id = $" + (params.length + 1);
      params.push(semester_id);
    }

    if (component_name && college_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM internal_marks_structure ims 
        WHERE ims.subject_id = ms.id 
        AND ims.college_id = $${params.length + 1} 
        AND ims.component_name = $${params.length + 2}
      )`;
      params.push(college_id, component_name);
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
                has_examination, periods_per_week, teacher_id, credit,
                COALESCE(
                   (SELECT json_agg(department_id) 
                    FROM master_subject_departments 
                    WHERE subject_id = master_subjects.id), 
                 '[]'::json) as department_ids
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

// Start: Bulk Master Subject API
const bulkUploadMasterSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "Invalid subjects payload" });
    }

    const { university_id } = req.user || {};
    const errors = [];
    const codesInBatch = new Set();
    const resolvedPrograms = {};
    const resolvedSemesters = {};

    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      const rowNum = i + 1;

      if (!s.name || !String(s.name).trim()) {
        errors.push({ row: rowNum, message: "Missing required field: name" });
      }
      if (!s.subject_code || !String(s.subject_code).trim()) {
        errors.push({ row: rowNum, message: "Missing required field: subject_code" });
      } else {
        const cleanCode = String(s.subject_code).trim().toUpperCase();
        if (codesInBatch.has(cleanCode)) {
          errors.push({ row: rowNum, message: `Duplicate subject code '${s.subject_code}' in upload file.` });
        }
        codesInBatch.add(cleanCode);
        const codeCheck = await client.query('SELECT id FROM master_subjects WHERE UPPER(TRIM(subject_code)) = $1', [cleanCode]);
        if (codeCheck.rows.length > 0) {
          errors.push({ row: rowNum, message: `Subject code '${s.subject_code}' already exists.` });
        }
      }

      // Resolve program_name → program_id
      if (s.program_name && !s.program_id) {
        const key = String(s.program_name).trim().toLowerCase();
        if (!resolvedPrograms[key]) {
          const pRes = await client.query("SELECT id FROM master_programs WHERE LOWER(TRIM(name)) = $1", [key]);
          if (pRes.rows.length === 0) {
            errors.push({ row: rowNum, message: `Program '${s.program_name}' not found.` });
          } else {
            resolvedPrograms[key] = pRes.rows[0].id;
          }
        }
      }

      // Resolve semester_name → semester_id
      if (s.semester_name && !s.semester_id) {
        const key = String(s.semester_name).trim().toLowerCase();
        if (!resolvedSemesters[key]) {
          const semRes = await client.query("SELECT id FROM master_semesters WHERE LOWER(TRIM(semester_name)) = $1", [key]);
          if (semRes.rows.length === 0) {
            errors.push({ row: rowNum, message: `Semester '${s.semester_name}' not found.` });
          } else {
            resolvedSemesters[key] = semRes.rows[0].id;
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: `Import rejected. Found ${errors.length} error(s).`, successes: 0, errors });
    }

    const validMappingTypes = ['Major 1', 'Major 2', 'Major', 'Minor', 'Elective', 'Vocational', 'FC-1', 'FC-2', 'FP/Int/Appr', 'AEC', 'SEC', 'VBC', 'English Literature', 'Hindi Literature'];

    const dbClient = await client.connect();
    try {
      await dbClient.query('BEGIN');
      for (const s of subjects) {
        const name = String(s.name).trim();
        const subject_code = String(s.subject_code).trim();
        const mapping_type = s.mapping_type && validMappingTypes.includes(s.mapping_type) ? s.mapping_type : 'Major';
        const is_mandatory = s.is_mandatory === 'E' ? 'E' : 'M';
        const has_examination = s.has_examination === false || s.has_examination === 'false' ? false : true;
        const periods_per_week = s.periods_per_week ? parseInt(s.periods_per_week, 10) || 6 : 6;
        let credit = ['Major 1', 'Major 2', 'Major', 'Minor', 'Elective'].includes(mapping_type) ? 6 : 4;
        if (s.credit) credit = parseInt(s.credit, 10) || credit;

        let program_id = s.program_id || null;
        if (!program_id && s.program_name) {
          const key = String(s.program_name).trim().toLowerCase();
          program_id = resolvedPrograms[key] || null;
        }

        let semester_id = s.semester_id || null;
        if (!semester_id && s.semester_name) {
          const key = String(s.semester_name).trim().toLowerCase();
          semester_id = resolvedSemesters[key] || null;
        }

        await dbClient.query(
          `INSERT INTO master_subjects (subject_code, name, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, credit, status, university_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', $10)`,
          [subject_code, name, program_id, semester_id, mapping_type, is_mandatory, has_examination, periods_per_week, credit, university_id || null]
        );
      }
      await dbClient.query('COMMIT');
      res.status(200).json({ message: `Successfully imported ${subjects.length} subjects.`, successes: subjects.length, errors: [] });
    } catch (txError) {
      await dbClient.query('ROLLBACK');
      throw txError;
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error("Bulk upload master subjects error:", error);
    res.status(500).json({ message: "Bulk upload failed", error: error.message });
  }
};
// End: Bulk Master Subject API

const getMasterPrograms = async (req, res) => {

  try {
    const { role } = req.user || {};
    const university_id = req.user?.university_id || req.user?.universityId;
    const uId = (role === 'superadmin' && req.query.universityId) ? req.query.universityId : (role === 'university_admin' ? university_id : null);

    let query = `SELECT p.id, p.name, p.status, p.created_at, p.duration_years, p.section_name, p.code, p.grading_system_type, p.enable_elective_subjects_selection, p.university_id,
                 COALESCE(
                   (SELECT json_agg(department_id) 
                    FROM master_program_departments 
                    WHERE program_id = p.id), 
                 '[]'::json) as department_ids
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
    let query = `SELECT id, name, duration_years, status, created_at, university_id,
                 COALESCE(
                   (SELECT json_agg(department_id) 
                    FROM master_program_departments 
                    WHERE program_id = master_programs.id), 
                 '[]'::json) as department_ids
                 FROM master_programs WHERE id = $1`;
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
      `SELECT mb.*, mp.name as program_name, p.name as policy_name 
       FROM master_batches mb
       LEFT JOIN master_programs mp ON mb.program_id = mp.id
       LEFT JOIN master_policies p ON mb.policy_id = p.id
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
    const { batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year } = req.body;
    if (!batch_name) return res.status(400).json({ message: "Batch name is required" });

    const result = await client.query(
      `INSERT INTO master_batches (batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active')
       RETURNING *`,
      [batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year]
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
    const { batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year } = req.body;

    const result = await client.query(
      `UPDATE master_batches 
       SET batch_name = $1, start_date = $2, end_date = $3, academic_year = $4, 
           import_fees_flag = $5, program_id = $6, policy_id = $7, start_year = $8, end_year = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [batch_name, start_date, end_date, academic_year, import_fees_flag, program_id, policy_id, start_year, end_year, id]
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
        u.name AS teacher_name,
        mt.employee_code AS teacher_employee_number
      FROM master_subject_mappings msm
      LEFT JOIN master_programs mp ON msm.program_id = mp.id
      LEFT JOIN master_semesters mse ON msm.semester_id = mse.id
      LEFT JOIN master_subjects ms ON msm.subject_id = ms.id
      LEFT JOIN master_teachers mt ON msm.teacher_id = mt.id
      LEFT JOIN users u ON mt.user_id = u.id
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
        md.department_code AS "departmentCode",
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
        mt.address,
        mdes.designation_type
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

    // Audit Log
    await dbClient.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'CREATE_TEACHER', 'master_teachers', $2, $3)`,
      [
        req.user.id,
        teacherId,
        JSON.stringify({
          employee_code: finalEmployeeCode,
          name,
          email,
          college_id,
          department_id,
          designation_id,
          qualification,
          experience_years: experience,
          specialization,
          status: status || 'Active'
        })
      ]
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
    let checkQuery = `
      SELECT mt.*, u.name AS user_name, u.email AS user_email
      FROM master_teachers mt
      LEFT JOIN users u ON mt.user_id = u.id
      WHERE mt.id = $1`;
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

    // Audit Log
    const fieldsToTrack = [
      'name', 'email', 'college_id', 'department_id', 'designation_id', 'qualification', 'experience', 'specialization',
      'pan_no', 'aadhaar_no', 'dob', 'gender', 'joining_date', 'phone', 'address', 'status',
      'employee_category_name', 'first_name', 'middle_name', 'last_name', 'job_title', 'employee_position_name',
      'employee_department_name', 'employee_grade_name', 'experience_detail', 'experience_months', 'marital_status',
      'father_name', 'mother_name', 'spouse_name', 'blood_group', 'country_name', 'home_address_line1', 'home_city',
      'home_state', 'home_country_name', 'office_phone1', 'office_phone2', 'office_state', 'home_phone1', 'fax'
    ];

    const oldValues = {};
    const newValues = {};

    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = field === 'experience' ? 'experience_years' : (field === 'name' ? 'user_name' : field);
        let oldVal = existing.rows[0][dbField];
        let newVal = req.body[field];

        if (oldVal === null) oldVal = undefined;
        if (newVal === '') newVal = null;

        if (oldVal != newVal) {
          oldValues[field] = existing.rows[0][dbField];
          newValues[field] = req.body[field];
        }
      }
    });

    if (Object.keys(newValues).length > 0) {
      await dbClient.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, 'UPDATE_TEACHER', 'master_teachers', $2, $3, $4)`,
        [req.user.id, id, JSON.stringify(oldValues), JSON.stringify(newValues)]
      );
    }

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
  const dbClient = await client.connect();

  try {
    // Fetch old values first for deletion audit (especially status, name, employee_code, etc.)
    const oldRes = await dbClient.query(
      `SELECT mt.id, mt.status, u.name, mt.employee_code 
       FROM master_teachers mt
       LEFT JOIN users u ON mt.user_id = u.id
       WHERE mt.id = $1`,
      [id]
    );

    if (oldRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Master teacher not found" });
    }

    const oldVal = oldRes.rows[0];

    await dbClient.query('BEGIN');

    // Soft delete: Update status to 'Inactive' instead of deleting the record
    const result = await dbClient.query(
      `UPDATE master_teachers 
       SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    // Audit Log
    await dbClient.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, 'DELETE_TEACHER', 'master_teachers', $2, $3, $4)`,
      [
        req.user.id,
        id,
        JSON.stringify({ status: oldVal.status, name: oldVal.name, employee_code: oldVal.employee_code }),
        JSON.stringify({ status: 'Inactive' })
      ]
    );

    await dbClient.query('COMMIT');

    res.json({
      success: true,
      message: "Teacher record deleted successfully",
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error("Delete master teacher error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  } finally {
    dbClient.release();
  }
};

const getMasterTeachersAuditLogs = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        u.name as user_name,
        u.email as user_email,
        al.old_values,
        al.new_values,
        al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = 'master_teachers'
       ORDER BY al.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get master teachers audit logs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Master Designation Functions
const getMasterDesignations = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT id, designation_name, status, designation_type
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
                 LEFT JOIN colleges c ON md.college_id = c.id
                 WHERE (md.status = 'Active' OR md.status IS NULL)`;
    const params = [];

    if (uId) {
      query += " AND (c.university_id = $1 OR md.college_id IS NULL)";
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
  const { department_name, department_code, status } = req.body;
  const college_id = req.user?.college_id || req.user?.collegeId || req.body.college_id || req.body.collegeId || null;

  try {
    if (!department_name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    // Generate department code if not provided
    const finalDeptCode = department_code || `DEPT-${Date.now().toString().slice(-8)}`;

    const result = await client.query(
      `INSERT INTO master_departments (department_name, department_code, status, college_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, department_name, department_code, status, college_id`,
      [department_name, finalDeptCode, status || 'Active', college_id]
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
    const { department_name, department_code, status } = req.body;

    if (!department_name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const result = await client.query(
      `UPDATE master_departments 
       SET department_name = $1, department_code = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, department_name, department_code, status`,
      [department_name, department_code, status, id]
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

    const { semester } = req.query;
    const filterSemester = semester || student.semister;

    // Fetch exams matching the student's program, semester (or requested), and college
    // Include exams if:
    // 1. Enrollment is open (current)
    // 2. Student is already registered (past or current)
    // 3. It's an internal exam (always visible when published)
    const query = `
      SELECT 
        e.id, 
        e.name as exam_name, 
        e.exam_type,
        e.semester_id,
        ms.semester_name,
        COALESCE(c.name, 'University-wide') as college_name,
        et.type_name as exam_type_name,
        sub.name as subject_name,
        sub.subject_code,
        e.exam_date, 
        e.start_time,
        e.end_time,
        e.student_application_open,
        er.payment_status,
        er.registration_date,
        COALESCE(esl.is_locked, false) as seating_locked
      FROM exams e
      JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      JOIN exam_types et ON e.exam_type = et.id
      JOIN master_subjects sub ON e.subject_id = sub.id
      JOIN master_programs mp ON e.program_id = mp.id
      LEFT JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = $1
      LEFT JOIN exam_seating_locks esl ON e.id = esl.exam_id AND esl.college_id = (SELECT id FROM colleges WHERE name ILIKE $4 LIMIT 1)
      WHERE e.is_published = true 
        AND mp.name = $2
        AND ms.semester_name = $3
        AND (c.name = $4 OR (e.college_id IS NULL AND e.exam_type = 2))
        AND (e.exam_type = 1 OR e.student_application_open = true OR er.id IS NOT NULL)
      ORDER BY e.exam_date DESC, e.start_time ASC
    `;

    const result = await client.query(query, [student.id, student.programName, filterSemester, student.collageName]);
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

    // Find student ID and department
    const studentRes = await client.query('SELECT id, department FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) return res.status(404).json({ message: "Student record not found." });
    const studentId = studentRes.rows[0].id;
    const deptName = studentRes.rows[0].department?.trim();

    // Retrieve college_id, semester_id, and program_id from the first exam
    const examRes = await client.query('SELECT semester_id, college_id, program_id, exam_type FROM exams WHERE id = $1', [exam_ids[0]]);
    if (examRes.rows.length === 0) return res.status(404).json({ message: "Exam not found." });
    const { semester_id: semesterId, college_id: collegeId, program_id: programId, exam_type: examType } = examRes.rows[0];

    // Only check attendance for external/regular exams (examType === 2)
    if (examType === 2) {
      let departmentId = null;
      if (deptName && collegeId) {
        const deptRes = await client.query('SELECT id FROM master_departments WHERE department_code = $1 AND college_id = $2', [deptName, collegeId]);
        if (deptRes.rows.length > 0) {
          departmentId = deptRes.rows[0].id;
        }
      }

      const attendanceQuery = `
        WITH total_sessions AS (
          SELECT 
            subject_id, 
            COUNT(DISTINCT (attendance_date, period_number, section)) as total_sessions
          FROM student_attendance
          WHERE college_id = $1 AND semester_id = $2
          GROUP BY subject_id
        ),
        student_present AS (
          SELECT 
            subject_id, 
            COUNT(*) as present_count
          FROM student_attendance
          WHERE student_id = $3 AND status = 'Present' AND semester_id = $2
          GROUP BY subject_id
        )
        SELECT 
          COALESCE(ts.total_sessions, 0) as total_sessions,
          COALESCE(sp.present_count, 0) as attended_sessions,
          CASE 
            WHEN COALESCE(ts.total_sessions, 0) > 0 
            THEN ROUND((COALESCE(sp.present_count, 0)::numeric / ts.total_sessions::numeric) * 100, 2)
            WHEN $2 IN (SELECT id FROM master_semesters WHERE semester_name ILIKE '%1%' OR semester_name ILIKE '%2%' OR semester_name ILIKE '%3%')
            THEN 100
            ELSE 0 
          END as attendance_percentage
        FROM master_subjects sub
        LEFT JOIN policy_program_subjects pps ON sub.id = pps.subject_id 
          AND pps.college_id = $1 
          AND pps.semester_id = $2 
          AND pps.program_id = $4
          AND ($5::integer IS NULL OR pps.department_id = $5 OR pps.department_id IS NULL)
        LEFT JOIN total_sessions ts ON sub.id = ts.subject_id
        LEFT JOIN student_present sp ON sub.id = sp.subject_id
        WHERE pps.subject_id IS NOT NULL OR sp.subject_id IS NOT NULL
      `;

      const attendanceRes = await client.query(attendanceQuery, [collegeId, semesterId, studentId, programId, departmentId]);
      const subjectsList = attendanceRes.rows;

      let overallPercentage = 0;
      if (subjectsList.length > 0) {
        const sum = subjectsList.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage), 0);
        overallPercentage = sum / subjectsList.length;
      }

      if (overallPercentage < 75) {
        return res.status(400).json({ 
          message: `Registration rejected: Your overall attendance is ${overallPercentage.toFixed(1)}%, which is below the required 75% threshold for exam eligibility.` 
        });
      }
    }

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

    // 1. Get complete student details AND verify paid exam registration
    const studentRes = await client.query(
      `SELECT 
           s.id, s.name, s.rollnumber, s."programName", s.semister, s."collageName", 
           s."fatherName", s.email, s."contactNumber", s.address, s.adharnumber,
           s.admission_no, s.batch, s.section, s.gender,
           -- Home college details
           home_col.id AS home_college_id,
           home_col.address AS home_college_address,
           -- Sitting center details
           center_col.id AS college_center_id,
           center_col.name AS college_center_name,
           center_col.address AS college_center_address,
           -- Student-specific sitting center details
           s.sitting_center_id AS student_sitting_center_id,
           student_center_col.id AS student_center_id,
           student_center_col.name AS student_center_name,
           student_center_col.address AS student_center_address,
           -- Seating details
           eh.hall_code,
           sa.row_no,
           sa.seat_no,
           sa.college_id AS actual_seat_college_id,
           actual_col.name AS actual_seat_college_name,
           actual_col.address AS actual_seat_college_address
        FROM students s
        JOIN exam_registrations er ON s.id = er.student_id
        JOIN exams e ON er.exam_id = e.id
        LEFT JOIN colleges home_col ON home_col.name ILIKE s."collageName"
        LEFT JOIN colleges center_col ON home_col.sitting_center_id = center_col.id
        LEFT JOIN colleges student_center_col ON s.sitting_center_id = student_center_col.id
        -- New Joins for Seating
        LEFT JOIN seating_arrangements sa ON sa.student_id = s.id AND sa.exam_id = e.id
        LEFT JOIN examination_halls eh ON sa.hall_id = eh.id
        LEFT JOIN colleges actual_col ON sa.college_id = actual_col.id
        WHERE s.user_id = $1 
          AND s."deleteStatus" = true 
          AND e.name = $2 
          AND e.semester_id = $3
          AND er.payment_status = 'Paid'`,
      [userId, examName, semesterId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(403).json({
        message: "Hall Ticket restricted. You must have a confirmed (Paid) registration for this exam session to generate an admit card."
      });
    }

    const studentRow = studentRes.rows[0];

    // Hall Ticket Generation Guard: Block access if seat is not yet allocated
    if (!studentRow.seat_no) {
      return res.status(403).json({
        message: "Hallticket not generated, please check after sometime"
      });
    }

    const student = {
      id: studentRow.id,
      name: studentRow.name,
      rollnumber: studentRow.rollnumber,
      programName: studentRow.programName,
      semister: studentRow.semister,
      collageName: studentRow.collageName,
      fatherName: studentRow.fatherName,
      email: studentRow.email,
      contactNumber: studentRow.contactNumber,
      address: studentRow.address,
      adharnumber: studentRow.adharnumber,
      admission_no: studentRow.admission_no,
      batch: studentRow.batch,
      section: studentRow.section,
      gender: studentRow.gender,
      hall_code: studentRow.hall_code,
      row_no: studentRow.row_no,
      seat_no: studentRow.seat_no
    };

    // Determine examination center: 
    // 1. Actual seated college from seating_arrangements (most accurate)
    // 2. External if student.sitting_center_id set (granular override)
    // 3. External if home_col.sitting_center_id set (bulk override)
    // 4. Else own college
    let center;
    if (studentRow.actual_seat_college_id) {
      center = {
        name: studentRow.actual_seat_college_name,
        address: studentRow.actual_seat_college_address,
        is_external: studentRow.actual_seat_college_id !== studentRow.home_college_id,
      };
    } else if (studentRow.student_center_id) {
      center = {
        name: studentRow.student_center_name,
        address: studentRow.student_center_address,
        is_external: true,
      };
    } else if (studentRow.college_center_id) {
      center = {
        name: studentRow.college_center_name,
        address: studentRow.college_center_address,
        is_external: true,
      };
    } else {
      center = {
        name: studentRow.collageName,
        address: studentRow.home_college_address,
        is_external: false,
      };
    }

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
        e.end_time,
        eh.hall_code,
        sa.seat_no,
        sa.row_no
      FROM exams e
      JOIN master_semesters ms ON e.semester_id = ms.id
      LEFT JOIN colleges c ON e.college_id = c.id
      JOIN exam_types et ON e.exam_type = et.id
      JOIN master_subjects sub ON e.subject_id = sub.id
      JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = $1
      LEFT JOIN seating_arrangements sa ON sa.student_id = $1 AND sa.exam_id = e.id
      LEFT JOIN examination_halls eh ON sa.hall_id = eh.id
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
      center,
      exams: examRes.rows,
      university: "Madhya Pradesh University of Excellence",
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

    // 2. Fetch marks for this specific exam name using the same logic as getStudentResults
    const query = `
      WITH ia_ranked AS (
          SELECT 
              sim_ia.student_id, 
              sim_ia.subject_id, 
              sim_ia.marks_obtained::float as marks,
              ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
          FROM student_internal_marks sim_ia
          JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
          WHERE ims_ia.component_name ILIKE 'IA%'
      ),
      ia_summary AS (
          SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
          FROM ia_ranked ir
          WHERE ir.rnk <= 2
          GROUP BY ir.student_id, ir.subject_id
      ),
      other_summary AS (
          SELECT 
              sim_o.student_id, 
              sim_o.subject_id, 
              SUM(sim_o.marks_obtained::float) as other_total
          FROM student_internal_marks sim_o
          JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
          WHERE ims_o.component_name NOT ILIKE 'IA%' 
            AND ims_o.component_name NOT ILIKE 'TOTAL%'
            AND ims_o.component_name NOT ILIKE 'BEST_OF_3%'
          GROUP BY sim_o.student_id, sim_o.subject_id
      ),
      raw_internal_totals AS (
          SELECT 
              COALESCE(i.student_id, o.student_id) as student_id,
              COALESCE(i.subject_id, o.subject_id) as subject_id,
              (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw,
              MAX(mws2.status) as batch_status
          FROM ia_summary i
          FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
          JOIN students s2 ON COALESCE(i.student_id, o.student_id) = s2.id
          JOIN colleges c2 ON LOWER(s2."collageName") = LOWER(c2.name)
          JOIN master_semesters sem2 ON s2.semister = sem2.semester_name
          LEFT JOIN marks_workflow_status mws2 ON COALESCE(i.subject_id, o.subject_id) = mws2.subject_id 
              AND mws2.college_id = c2.id 
              AND mws2.semester_id = sem2.id
          LEFT JOIN component_acceptance ca ON ca.college_id = c2.id 
              AND ca.subject_id = COALESCE(i.subject_id, o.subject_id)
          WHERE (mws2.status IN ('Approved', 'Locked') OR ca.is_accepted = true)
          GROUP BY COALESCE(i.student_id, o.student_id), COALESCE(i.subject_id, o.subject_id), i.ia_total, o.other_total
      ),
      raw_internal AS (
          SELECT 
              t.*,
              (
                  SELECT json_agg(json_build_object(
                      'name', ims_inner.component_name,
                      'marks', sim_inner.marks_obtained::float
                  ))
                  FROM student_internal_marks sim_inner
                  JOIN internal_marks_structure ims_inner ON sim_inner.component_id = ims_inner.id
                  WHERE sim_inner.student_id = t.student_id 
                    AND sim_inner.subject_id = t.subject_id
                    AND ims_inner.component_name NOT ILIKE 'TOTAL%'
                    AND ims_inner.component_name NOT ILIKE 'BEST_OF_3%'
              ) as components
          FROM raw_internal_totals t
      )
      
      SELECT 
        m.id as mark_id,
        COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks,
        COALESCE(m.external_marks, 0) as external_marks,
        COALESCE(e.moderation_marks, 0) as moderation_marks,
        COALESCE(m.grace_marks, 0) as grace_marks,
        (
            COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + 
            COALESCE(m.external_marks, 0) + 
            COALESCE(e.moderation_marks, 0) + 
            COALESCE(m.grace_marks, 0)
        ) as total_marks,
        m.status as result_status,
        e.name as exam_name,
        e.id as exam_id,
        sub.name as subject_name,
        sub.subject_code,
        sub.credit as credits,
        mp.name as program_name,
        sem.semester_name,
        s."collageName" as college_name,
        raw_internal.batch_status as batch_status,
        raw_internal.components as assessment_components
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN master_subjects sub ON m.subject_id = sub.id
      JOIN master_programs mp ON e.program_id = mp.id
      JOIN master_semesters sem ON e.semester_id = sem.id
      JOIN students s ON m.student_id = s.id
      LEFT JOIN calculated_internal_marks cim ON m.student_id = cim.student_id 
          AND (cim.subject_id = m.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
      LEFT JOIN raw_internal ON m.student_id = raw_internal.student_id AND sub.id = raw_internal.subject_id
      WHERE m.student_id = $1 AND e.name = $2 AND e.results_published = true AND (m.status IN ('Pass', 'Fail', 'Finalized', 'Approved', 'Pending Approval', 'Draft', 'Internal Only'))
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


const getNextAdmissionSerialRoute = async (req, res) => {
  try {
    const { year, department } = req.params;
    if (!year || !department) return res.status(400).json({ message: "Year and Department are required" });

    const next = await calculateNextSerial(client, year, department, 'admission');
    res.json({ nextSerial: next });
  } catch (error) {
    console.error("Get next admission serial error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  initiateRegistration,
  verifyOtp,
  setInitialPassword,
  changePassword,
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getPrograms,
  getSubjects,
  getLoginHistory,
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
  getUniversityById,
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
  bulkUploadStudents,
  bulkUploadTeachers,
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
  getMasterTeachersAuditLogs,
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
  bulkUploadMarks,
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
  getStudentAttendance,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
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
  unmapMasterPolicy,
  getNextAdmissionSerial: getNextAdmissionSerialRoute,
  submitMarksDiscrepancy,
  getStudentDiscrepancies,
  getStudentInternalExamAttendance,
  getAdminInternalExamAttendance,
  getFacultyInternalExamAttendance,
  bulkUploadUniversities,
  bulkUploadColleges,
  bulkUploadMasterSubjects,
  bulkUploadDepartments,
  bulkUploadPrograms,
  bulkUploadAcademicYears,
  bulkUploadSemesters,
  bulkUploadBatches
};
