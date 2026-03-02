# Master Teachers Implementation Guide

## Overview
This document outlines the complete implementation of master teachers, designations, and departments functionality for the EMS system.

---

## 1. Database Setup

### SQL Migration File
**Location**: `Server/master_tables_migration.sql`

The migration creates three master tables:

#### Table 1: `master_designation`
```sql
CREATE TABLE master_designation (
    id SERIAL PRIMARY KEY,
    designation_name VARCHAR(255) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);
```

**Run this migration on your PostgreSQL database:**
```bash
psql -U postgres -h 172.16.0.225 -d emsdb -f Server/master_tables_migration.sql
```

#### Table 2: `master_department`
```sql
CREATE TABLE master_department (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);
```

#### Table 3: `master_teachers`
```sql
CREATE TABLE master_teachers (
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
```

---

## 2. Backend API Implementation

### New Routes Added
**Location**: `Server/routes/routes.js`

```javascript
// Master Teachers Routes
router.get('/master-teachers', verifyToken, getMasterTeachers);
router.get('/master-teachers/:id', verifyToken, getMasterTeacher);
router.post('/master-teachers', verifyToken, createMasterTeacher);
router.put('/master-teachers/:id', verifyToken, updateMasterTeacher);
router.delete('/master-teachers/:id', verifyToken, deleteMasterTeacher);

// Master Designations Routes
router.get('/master-designations', verifyToken, getMasterDesignations);
router.post('/master-designations', verifyToken, createMasterDesignation);

// Master Departments Routes
router.get('/master-departments', verifyToken, getMasterDepartments);
router.post('/master-departments', verifyToken, createMasterDepartment);
```

### Backend Controller Functions
**Location**: `Server/controllers/controller.js`

#### Master Teachers Functions

**1. getMasterTeachers** - Fetch all active master teachers with related data
```javascript
GET /api/master-teachers
Response: [{
  id: 1,
  name: "Dr. John Doe",
  email: "john@college.edu",
  college_name: "Engineering College",
  department: "Computer Science",
  designation: "Professor",
  experience: 15,
  status: true
}]
```

**2. getMasterTeacher** - Fetch a single teacher by ID
```javascript
GET /api/master-teachers/:id
Response: { id, name, email, college_id, department_id, designation_id, experience, status, ... }
```

**3. createMasterTeacher** - Create a new teacher record
```javascript
POST /api/master-teachers
Body: {
  name: "Dr. Jane Smith",
  email: "jane@college.edu",
  college_id: 1,
  department_id: 2,
  designation_id: 3,
  experience: 10,
  status: true
}
```

**4. updateMasterTeacher** - Update teacher details
```javascript
PUT /api/master-teachers/:id
Body: { name, email, college_id, department_id, designation_id, experience, status }
```

**5. deleteMasterTeacher** - Delete teacher record
```javascript
DELETE /api/master-teachers/:id
```

#### Master Designations Functions

**1. getMasterDesignations** - Fetch all designations
```javascript
GET /api/master-designations
Response: [{
  id: 1,
  designation_name: "Professor",
  status: true
}]
```

**2. createMasterDesignation** - Create new designation
```javascript
POST /api/master-designations
Body: {
  designation_name: "Associate Professor",
  status: true
}
```

#### Master Departments Functions

**1. getMasterDepartments** - Fetch all departments
```javascript
GET /api/master-departments
Response: [{
  id: 1,
  department_name: "Computer Science",
  status: true
}]
```

**2. createMasterDepartment** - Create new department
```javascript
POST /api/master-departments
Body: {
  department_name: "Electrical Engineering",
  status: true
}
```

---

## 3. Frontend Implementation

### Updated Teachers.js Page
**Location**: `mp-ems/src/pages/Teachers.js`

#### Key Changes:

**1. Data Structure Update**
- Changed from `teacher_name` to `name`
- Uses IDs instead of string values for designation and department
- Changed to use dropdown selects instead of free text

**2. State Management**
```javascript
const [designationOptions, setDesignationOptions] = useState([]);
const [departmentOptions, setDepartmentOptions] = useState([]);
const [collegeOptions, setCollegeOptions] = useState([]);
```

**3. Form Data Structure**
```javascript
const [addForm, setAddForm] = useState({
  name: '',
  email: '',
  college_id: '',
  designation_id: '',
  department_id: '',
  experience: '',
  status: true
});
```

**4. Fetch Options on Mount**
```javascript
// Fetches designations, departments, and colleges
useEffect(() => {
  fetchOptions(); // Populates dropdown options
}, []);
```

**5. API Endpoints Used**
- `GET /api/master-teachers` - Fetch all teachers
- `POST /api/master-teachers` - Create teacher
- `PUT /api/master-teachers/:id` - Update teacher
- `DELETE /api/master-teachers/:id` - Delete teacher
- `GET /api/master-designations` - Fetch designations
- `GET /api/master-departments` - Fetch departments
- `GET /api/colleges` - Fetch colleges

**6. Table Display Fields**
```javascript
const availableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'college_name', label: 'College' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'experience', label: 'Experience' },
  { key: 'status', label: 'Status' }
];
```

#### Modal Form Fields:
1. **Full Name** (Text Input) - Name field
2. **Official Email** (Email Input) - Email field
3. **Institute/College** (Dropdown) - College selection
4. **Current Designation** (Dropdown) - Designation selection
5. **Department** (Dropdown) - Department selection
6. **Years Experience** (Number Input) - Experience in years
7. **Personnel Status** (Toggle Checkbox) - Active/Inactive status

---

## 4. Step-by-Step Setup Instructions

### Step 1: Database Setup
```bash
# Connect to your PostgreSQL database and run the migration
cd Server
psql -U postgres -h 172.16.0.225 -d emsdb < master_tables_migration.sql
```

### Step 2: Insert Master Data (Optional Initial Data)
```sql
-- Insert designations
INSERT INTO master_designation (designation_name, status) VALUES
('Professor', TRUE),
('Associate Professor', TRUE),
('Assistant Professor', TRUE),
('Lecturer', TRUE),
('Senior Lecturer', TRUE),
('Lab Instructor', TRUE);

-- Insert departments
INSERT INTO master_department (department_name, status) VALUES
('Computer Science', TRUE),
('Electrical Engineering', TRUE),
('Mechanical Engineering', TRUE),
('Civil Engineering', TRUE),
('Electronics', TRUE);

-- Insert sample teachers
INSERT INTO master_teachers (name, email, college_id, department_id, designation_id, experience, status) VALUES
('Dr. John Smith', 'john.smith@college.edu', 1, 1, 1, 15, TRUE),
('Dr. Jane Doe', 'jane.doe@college.edu', 1, 1, 2, 10, TRUE);
```

### Step 3: Start Backend Server
```bash
cd Server
npm start
# Server will run on http://localhost:8080
```

### Step 4: Start Frontend Application
```bash
cd mp-ems
npm start
# Frontend will run on http://localhost:3000
```

### Step 5: Access Teachers Management
Navigate to the Teachers page in your application. You should see:
- List of all master teachers
- Options to add new teachers
- Edit/Delete functionality
- Filter by designation
- Search functionality
- Pagination and column visibility toggles

---

## 5. API Call Examples

### Create a New Teacher
```bash
curl -X POST http://localhost:8080/api/master-teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Dr. Sarah Wilson",
    "email": "sarah@college.edu",
    "college_id": 1,
    "department_id": 2,
    "designation_id": 1,
    "experience": 12,
    "status": true
  }'
```

### Get All Teachers
```bash
curl -X GET http://localhost:8080/api/master-teachers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get All Designations
```bash
curl -X GET http://localhost:8080/api/master-designations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update a Teacher
```bash
curl -X PUT http://localhost:8080/api/master-teachers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "experience": 13,
    "status": true
  }'
```

---

## 6. Field Data Types & Validation

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| name | VARCHAR(255) | Yes | Must be provided |
| email | VARCHAR(255) | Yes | Must be unique, valid email format |
| college_id | INTEGER | No | Must reference existing college |
| department_id | INTEGER | No | Must reference existing department |
| designation_id | INTEGER | Yes | Must reference existing designation |
| experience | INTEGER | No | Non-negative number (default: 0) |
| status | BOOLEAN | No | True/False (default: TRUE) |

---

## 7. Troubleshooting

### Issue: "Failed to fetch teachers"
- Ensure the backend server is running on port 8080
- Check that authentication token is valid
- Verify database connection

### Issue: Dropdown options aren't loading
- Check browser console for CORS errors
- Verify master-designations and master-departments endpoints are working
- Ensure college data exists in the colleges table

### Issue: Cannot insert duplicate email
- Email must be unique for each teacher
- Check if email already exists in master_teachers table

### Issue: Foreign key constraints fail
- Ensure college_id references an existing college in colleges table
- Ensure department_id references an existing department in master_department table
- Ensure designation_id references an existing designation in master_designation table

---

## 8. Database Relationships

```
master_teachers
├── college_id → colleges.id
├── department_id → master_department.id
└── designation_id → master_designation.id
```

All relationships are:
- ON DELETE CASCADE: Deleting a college/department/designation will cascade delete related teachers
- Should be carefully tested in production before implementing

---

## Files Modified/Created

### New Files:
- `Server/master_tables_migration.sql` - Database schema migration

### Modified Files:
- `Server/controllers/controller.js` - Added 7 new functions (getMasterTeachers, getMasterTeacher, createMasterTeacher, updateMasterTeacher, deleteMasterTeacher, getMasterDesignations, createMasterDesignation, getMasterDepartments, createMasterDepartment)
- `Server/routes/routes.js` - Added new routes for master teachers, designations, and departments
- `mp-ems/src/pages/Teachers.js` - Updated to fetch and display from master_teachers table with dropdowns

---

## Next Steps

1. ✅ Run database migration
2. ✅ Insert master data (designations, departments)
3. ✅ Start backend server
4. ✅ Start frontend application
5. ✅ Test Teachers page functionality
6. ✅ Add, edit, delete teachers to verify operations
7. ✅ Test filtering and search features
8. ⚠️ Implement audit logging for create/update/delete operations
9. ⚠️ Add bulk import feature for teachers
10. ⚠️ Add export to CSV functionality
