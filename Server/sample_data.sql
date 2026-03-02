-- Sample data for master tables
-- Run this after the migration has been applied

-- Insert sample designations
INSERT INTO master_designations (designation_name, designation_type, level, status) VALUES
('Professor', 'Teaching', 1, 'Active'),
('Associate Professor', 'Teaching', 2, 'Active'),
('Assistant Professor', 'Teaching', 3, 'Active'),
('Lecturer', 'Teaching', 4, 'Active'),
('Senior Lecturer', 'Teaching', 4, 'Active'),
('Lab Instructor', 'Teaching', 5, 'Active'),
('Head of Department (HOD)', 'Administrative', 1, 'Active'),
('Dean', 'Administrative', 1, 'Active'),
('Vice Principal', 'Administrative', 1, 'Active')
ON CONFLICT (designation_name) DO NOTHING;

-- Insert sample departments (Make sure colleges exist first!)
INSERT INTO master_departments (department_code, department_name, college_id, status) 
SELECT 'CS', 'Computer Science', id, 'Active' FROM colleges LIMIT 1
ON CONFLICT (department_code) DO NOTHING;

INSERT INTO master_departments (department_code, department_name, college_id, status) 
SELECT 'EE', 'Electrical Engineering', id, 'Active' FROM colleges WHERE id NOT IN (SELECT college_id FROM master_departments) LIMIT 1
ON CONFLICT (department_code) DO NOTHING;

INSERT INTO master_departments (department_code, department_name, college_id, status) 
SELECT 'ME', 'Mechanical Engineering', id, 'Active' FROM colleges WHERE id NOT IN (SELECT college_id FROM master_departments) LIMIT 1
ON CONFLICT (department_code) DO NOTHING;

INSERT INTO master_departments (department_code, department_name, college_id, status) 
SELECT 'IT', 'Information Technology', id, 'Active' FROM colleges WHERE id NOT IN (SELECT college_id FROM master_departments) LIMIT 1
ON CONFLICT (department_code) DO NOTHING;

INSERT INTO master_departments (department_code, department_name, college_id, status) 
SELECT 'EC', 'Electronics & Communication', id, 'Active' FROM colleges WHERE id NOT IN (SELECT college_id FROM master_departments) LIMIT 1
ON CONFLICT (department_code) DO NOTHING;

-- Sample teachers (Make sure users, colleges, departments, and designations exist)
-- First, let's create some users for the sample teachers
INSERT INTO users (name, email, password_hash) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@college.edu', 'hashed_password_1'),
('Dr. Priya Singh', 'priya.singh@college.edu', 'hashed_password_2'),
('Prof. Amit Patel', 'amit.patel@college.edu', 'hashed_password_3'),
('Dr. Anjali Sharma', 'anjali.sharma@college.edu', 'hashed_password_4')
ON CONFLICT (email) DO NOTHING;

-- Now insert master teachers
INSERT INTO master_teachers (user_id, employee_code, designation_id, department_id, college_id, experience_years, status)
SELECT 
  u.id,
  'EMP-' || u.id,
  (SELECT id FROM master_designations WHERE designation_name = 'Professor' LIMIT 1),
  (SELECT id FROM master_departments LIMIT 1),
  (SELECT college_id FROM master_departments LIMIT 1),
  15,
  'Active'
FROM users u
WHERE u.email = 'rajesh.kumar@college.edu'
AND NOT EXISTS (SELECT 1 FROM master_teachers WHERE user_id = u.id)
LIMIT 1;

INSERT INTO master_teachers (user_id, employee_code, designation_id, department_id, college_id, experience_years, status)
SELECT 
  u.id,
  'EMP-' || u.id,
  (SELECT id FROM master_designations WHERE designation_name = 'Associate Professor' LIMIT 1),
  (SELECT id FROM master_departments LIMIT 1),
  (SELECT college_id FROM master_departments LIMIT 1),
  10,
  'Active'
FROM users u
WHERE u.email = 'priya.singh@college.edu'
AND NOT EXISTS (SELECT 1 FROM master_teachers WHERE user_id = u.id)
LIMIT 1;

INSERT INTO master_teachers (user_id, employee_code, designation_id, department_id, college_id, experience_years, status)
SELECT 
  u.id,
  'EMP-' || u.id,
  (SELECT id FROM master_designations WHERE designation_name = 'Assistant Professor' LIMIT 1),
  (SELECT id FROM master_departments LIMIT 1),
  (SELECT college_id FROM master_departments LIMIT 1),
  5,
  'Active'
FROM users u
WHERE u.email = 'amit.patel@college.edu'
AND NOT EXISTS (SELECT 1 FROM master_teachers WHERE user_id = u.id)
LIMIT 1;

INSERT INTO master_teachers (user_id, employee_code, designation_id, department_id, college_id, experience_years, status)
SELECT 
  u.id,
  'EMP-' || u.id,
  (SELECT id FROM master_designations WHERE designation_name = 'Lecturer' LIMIT 1),
  (SELECT id FROM master_departments LIMIT 1),
  (SELECT college_id FROM master_departments LIMIT 1),
  3,
  'Active'
FROM users u
WHERE u.email = 'anjali.sharma@college.edu'
AND NOT EXISTS (SELECT 1 FROM master_teachers WHERE user_id = u.id)
LIMIT 1;

-- Verify the data was inserted
SELECT 'Designations count:' as info, COUNT(*) FROM master_designations;
SELECT 'Departments count:' as info, COUNT(*) FROM master_departments;
SELECT 'Teachers count:' as info, COUNT(*) FROM master_teachers;
