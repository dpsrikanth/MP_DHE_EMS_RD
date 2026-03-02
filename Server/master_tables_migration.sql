-- Master Tables for Teachers, Designation, and Department
-- This migration creates the master data tables

-- Create master_designation table
CREATE TABLE IF NOT EXISTS master_designation (
    id SERIAL PRIMARY KEY,
    designation_name VARCHAR(255) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Create master_department table
CREATE TABLE IF NOT EXISTS master_department (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Create master_teachers table
CREATE TABLE IF NOT EXISTS master_teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    college_id INTEGER REFERENCES colleges(id),
    department_id INTEGER REFERENCES master_department(id),
    designation_id INTEGER REFERENCES master_designation(id),
    experience INTEGER DEFAULT 0,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_master_teachers_college_id ON master_teachers(college_id);
CREATE INDEX IF NOT EXISTS idx_master_teachers_department_id ON master_teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_master_teachers_designation_id ON master_teachers(designation_id);
CREATE INDEX IF NOT EXISTS idx_master_teachers_status ON master_teachers(status);
