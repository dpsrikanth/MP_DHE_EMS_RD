const express = require("express");
const bcrypt = require("bcryptjs");
const client = require("../db");
const jwt=require("jsonwebtoken")
const jwt_key="1234"
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
      totalUsers: "SELECT COUNT(*) FROM public.users",
      activeExams: "SELECT COUNT(*) FROM public.exam_types",
      totalPrograms: "SELECT COUNT(*) FROM public.programs",
      totalSemesters: "SELECT COUNT(*) FROM public.semesters",
      totalSubjects: "SELECT COUNT(*) FROM public.subjects",
      totalAcademicYears: "SELECT COUNT(*) FROM public.academic_years",
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
      "SELECT id, name, duration_years FROM public.programs",
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
      "SELECT id, subject_code, subject_name, credit, max_internal, max_external FROM public.subjects LIMIT 10",
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
      "SELECT id, year_name FROM public.academic_years",
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
      "SELECT id, program_id, semester_no FROM public.semesters",
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
      "SELECT id, type_name FROM public.exam_types",
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
      "SELECT id, role_name FROM public.roles",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const Login = async (req, res) => {
  try {
    const { email, password_hash } = req.body;

     const user = await client.query(
      `SELECT u.id, u.name, u.email, u.password_hash, r.role_name
       FROM public.users u
       JOIN public.roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const result = user.rows[0];

    // const ismatch = await bcrypt.compare(
    //   password,
    //   result.password_hash
    // );

    // if (!ismatch) {
    //   return res.status(403).json({ message: "Invalid credentials" });
    // }

    const token = jwt.sign(
      { id: result.id, email: result.email },
      jwt_key,
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
  Login
};
