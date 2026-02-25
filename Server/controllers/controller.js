
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
      "SELECT id, year_name, university_id FROM academic_years"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    const { email, password } = req.body;

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

    // const ismatch = await bcrypt.compare(password, result.password);

    // if (!ismatch) {
    //   return res.status(403).json({ message: "Invalid credentials" });
    // }

    const token = jwt.sign(
      { 
        id: result.id, 
        email: result.email,
        role: result.role_name
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "User logged in successfully",
      data: result,
      token: token,
    });

  } catch (err) {
    console.log("Login Error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUniversities = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, name, address, status, created_at FROM universities"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get universities error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
      "SELECT id, name, university_id, address, status, created_at FROM colleges"
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
      `SELECT t.id, u.name as teacher_name, u.email, t.college_id, t.designation, t.status
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
  getStudents,
  getColleges,
  getTeachers,
  getExams,
  getMarks
};
