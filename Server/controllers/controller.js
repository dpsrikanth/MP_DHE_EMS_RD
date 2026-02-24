const express = require('express');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Create client instance (or import from server.js)
const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
});

const getUserData = (req, res) => {
    const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com'
    };
    res.json(userData);
};

// Register endpoint
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['superAdmin', 'student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email exists
    const existingUser = await client.query(
      'SELECT * FROM public.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await client.query(
      'INSERT INTO public.users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getUserData, register };