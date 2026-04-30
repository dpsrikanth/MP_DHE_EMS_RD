const express = require('express');
const router = express.Router();
const { initiateRegistration, verifyOtp, setInitialPassword, changePassword, getDashboardStats, getUsers, createUser, updateUser, deleteUser, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles, createRole, updateRole, deleteRole, Login, refreshToken, getUniversities, createUniversity, updateUniversity, deleteUniversity, createCollege, updateCollege, deleteCollege, createProgram, updateProgram, deleteProgram, createAcademicYear, updateAcademicYear, deleteAcademicYear, getStudents, getColleges, getTeachers, updateTeacher, getExams, createExam, updateExam, deleteExam, publishExam, toggleStudentApplication, getMarks, getMasterSemesters, createMasterSemester, updateMasterSemester, deleteMasterSemester, getMasterSemester, getMasterSubjects, createMasterSubject, updateMasterSubject, deleteMasterSubject, getMasterSubject, getMasterPrograms, createMasterProgram, getMasterProgram, updateMasterProgram, deleteMasterProgram, getMasterPolicies, getMasterPolicy, createMasterPolicy, updateMasterPolicy, deleteMasterPolicy, getCollegeMasterPolicy, createStudent, bulkUploadStudents, bulkUploadTeachers, updateStudent, deleteStudent, getMasterTeachers, getMasterTeacher, createMasterTeacher, updateMasterTeacher, deleteMasterTeacher, getMasterDesignations, createMasterDesignation, getMasterDepartments, createMasterDepartment, getCollegeSemesters, getCollegePrograms, getCollegePolicies, getCollegeAcademicYears, getMasterDepartment, updateMasterDepartment, deleteMasterDepartment, getStudentsForMarks, saveTeacherMarks, getMarksForApproval, approveRejectMarks, getMasterBatches, createMasterBatch, updateMasterBatch, deleteMasterBatch, getSubjectMappings, createSubjectMapping, updateSubjectMapping, deleteSubjectMapping, getStudentExams, registerForExam, publishResults, getStudentResults, getStudentAttendance, getStudentAttendanceDetail, getStudentAttendanceHistory, getHallTicketData, getResultSheetData, forgotPassword, resetPassword, mapMasterProgram, unmapMasterProgram, mapMasterSemester, unmapMasterSemester, mapMasterAcademicYear, unmapMasterAcademicYear, mapMasterPolicy, unmapMasterPolicy, getNextAdmissionSerial } = require('../controllers/controller');
const { getMasters, getUniversityConfig, updateUniversityConfig, getCollegeConfig, updateCollegeConfig } = require('../controllers/masterController');
const { getSmtpConfig, updateSmtpConfig } = require('../controllers/configController');
const { autoAllocateSeats, clearAssignments, getSeatingArrangements, lockSeating } = require('../controllers/seatController');
const { getMilestones, createMilestone, updateMilestone, deleteMilestone, cloneMilestones } = require('../controllers/milestoneController');
const { getRounds, createRound, getSchedules, saveSchedules, getAvailableContexts } = require('../controllers/internalExamController');
const { getSetting, updateSetting } = require('../controllers/settingsController');
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed login/auth requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login Validation Middleware
const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required').trim(),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and password management
 */

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/register', initiateRegistration);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setInitialPassword);

router.get('/demo/apply-grace', async (req, res) => {
    try {
        const { applyGraceMarks } = require('../utils/graceUtils');
        const db = require('../db');
        const rollNumber = '25BT1303';
        const examName = 'Programming Lab';
        
        const studentRes = await db.query(`
            SELECT s.id, c.university_id 
            FROM students s
            LEFT JOIN colleges c ON s."collageName" = c.name
            WHERE s.rollnumber = $1
        `, [rollNumber]);
        
        if (studentRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        const studentId = studentRes.rows[0].id;
        const universityId = studentRes.rows[0].university_id || 1;

        await db.query(`
            UPDATE grading_configs 
            SET grace_policy = '{"is_enabled": true, "max_total_grace": 5, "max_per_subject_grace": 3}'
            WHERE university_id = $1
        `, [universityId]);

        await db.query(`
            UPDATE marks 
            SET internal_marks = 16, external_marks = 22, total_marks = 38, status = 'Fail', grace_marks = 0
            WHERE student_id = $1 AND exam_id = (SELECT id FROM exams WHERE name = $2 LIMIT 1)
        `, [studentId, examName]);

        await applyGraceMarks(studentId, examName, universityId, null);
        
        res.json({ 
            message: "Grace demo completed successfully", 
            student: "Sanjana KC", 
            subject: "Programming Lab", 
            action: "Marks updated to 38 -> Grace Engine triggered -> Now Pass (40)" 
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /api/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post('/change-password', verifyToken, changePassword);

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 */
router.get('/roles', getRoles);
/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Role created successfully
 *
 * /api/roles/{id}:
 *   put:
 *     summary: Update an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */
router.post('/roles', verifyToken, authorizeRole('superadmin'), createRole);
router.put('/roles/:id', verifyToken, authorizeRole('superadmin'), updateRole);
router.delete('/roles/:id', verifyToken, authorizeRole('superadmin'), deleteRole);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, validateLogin, Login);
router.post('/refresh-token', authLimiter, refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get high-level system statistics for the dashboard
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', verifyToken, getDashboardStats);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', verifyToken, getUsers);
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *
 * /api/users/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.post('/users', verifyToken, createUser);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);
/**
 * @swagger
 * tags:
 *   name: Academic Hierarchy
 *   description: Management of programs, subjects, and semesters
 */

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all academic programs
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of programs
 */
router.get('/programs', verifyToken, getPrograms);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/subjects', verifyToken, getSubjects);
router.get('/academic-years', verifyToken, getAcademicYears);
router.get('/semesters', verifyToken, getSemesters);
/**
 * @swagger
 * /api/exam-types:
 *   get:
 *     summary: List all available exam types (Regular, Backlog, etc.)
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exam types
 */
router.get('/exam-types', verifyToken, getExamTypes);

/**
 * @swagger
 * tags:
 *   name: Institutions
 *   description: Management of Universities and Colleges
 */

/**
 * @swagger
 * /api/universities:
 *   get:
 *     summary: List all universities
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of universities
 *   post:
 *     summary: Create a new university
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/University'
 *     responses:
 *       201:
 *         description: University created successfully
 *
 * /api/universities/{id}:
 *   put:
 *     summary: Update an existing university
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/University'
 *     responses:
 *       200:
 *         description: University updated successfully
 *   delete:
 *     summary: Delete a university
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: University deleted successfully
 */
router.get('/universities', verifyToken, getUniversities);
router.post('/universities', verifyToken, createUniversity);
router.put('/universities/:id', verifyToken, updateUniversity);
router.delete('/universities/:id', verifyToken, deleteUniversity);

/**
 * @swagger
 * /api/masters:
 *   get:
 *     summary: Get all master data for initial application load
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compiled master data
 */
router.get('/masters', verifyToken, getMasters);
router.get('/universities/:id/config', verifyToken, getUniversityConfig);
router.put('/universities/:id/config', verifyToken, updateUniversityConfig);

/**
 * @swagger
 * /api/colleges:
 *   get:
 *     summary: List all colleges
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of colleges
 */
/**
 * @swagger
 * /api/colleges:
 *   get:
 *     summary: List all colleges
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of colleges
 *   post:
 *     summary: Create a new college
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/College'
 *     responses:
 *       201:
 *         description: College created successfully
 *
 * /api/colleges/{id}:
 *   put:
 *     summary: Update an existing college
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/College'
 *     responses:
 *       200:
 *         description: College updated successfully
 *   delete:
 *     summary: Delete a college
 *     tags: [Institutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: College deleted successfully
 */
router.get('/colleges', verifyToken, getColleges);
router.post('/colleges', verifyToken, createCollege);
router.put('/colleges/:id', verifyToken, updateCollege);
router.delete('/colleges/:id', verifyToken, deleteCollege);

/**
 * @swagger
 * /api/colleges/{id}/config:
 *   get:
 *     summary: Get configuration for a specific college
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: College configuration
 */
router.get('/colleges/:id/config', verifyToken, getCollegeConfig);
/**
 * @swagger
 * /api/colleges/{id}/config:
 *   put:
 *     summary: Update configuration for a specific college
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.put('/colleges/:id/config', verifyToken, updateCollegeConfig);

// System Settings
router.get('/settings/:key', verifyToken, getSetting);
router.put('/settings/:key', verifyToken, authorizeRole('university_admin'), updateSetting);

// College cascading data endpoints
/**
 * @swagger
 * /api/colleges/{collegeId}/semesters:
 *   get:
 *     summary: Get semesters active for a college
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: collegeId
 *         required: true
 */
router.get('/colleges/:collegeId/semesters', verifyToken, getCollegeSemesters);
router.get('/colleges/:collegeId/programs', verifyToken, getCollegePrograms);
router.get('/colleges/:collegeId/policies', verifyToken, getCollegePolicies);
router.get('/colleges/:collegeId/academic-years', verifyToken, getCollegeAcademicYears);

/**
 * @swagger
 * /api/programs:
 *   post:
 *     summary: Create a new academic program
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Program'
 *     responses:
 *       201:
 *         description: Program created successfully
 *
 * /api/programs/{id}:
 *   put:
 *     summary: Update an existing program
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Program'
 *     responses:
 *       200:
 *         description: Program updated successfully
 *   delete:
 *     summary: Delete a program
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Program deleted successfully
 */
router.post('/programs', verifyToken, createProgram);
router.put('/programs/:id', verifyToken, updateProgram);
router.delete('/programs/:id', verifyToken, deleteProgram);
/**
 * @swagger
 * /api/academic-years:
 *   post:
 *     summary: Create a new academic year
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year_name: { type: string }
 *     responses:
 *       201:
 *         description: Academic year created
 *
 * /api/academic-years/{id}:
 *   put:
 *     summary: Update an existing academic year
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year_name: { type: string }
 *     responses:
 *       200:
 *         description: Academic year updated
 *   delete:
 *     summary: Delete an academic year
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Academic year deleted
 */
router.post('/academic-years', verifyToken, createAcademicYear);
router.put('/academic-years/:id', verifyToken, updateAcademicYear);
router.delete('/academic-years/:id', verifyToken, deleteAcademicYear);
/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: List all students
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/students', verifyToken, getStudents);
/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfuly
 *
 * /api/students/{id}:
 *   put:
 *     summary: Update an existing student
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *   delete:
 *     summary: Delete a student
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted successfully
 */
router.post('/students', verifyToken, createStudent);
router.get('/students/next-serial/:year/:department', verifyToken, getNextAdmissionSerial);
router.post('/students/bulk-upload', verifyToken, bulkUploadStudents);
router.put('/students/:id', verifyToken, updateStudent);
router.delete('/students/:id', verifyToken, deleteStudent);

router.post('/teachers/bulk-upload', verifyToken, bulkUploadTeachers);

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: List all teachers/faculty members
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/teachers', verifyToken, getTeachers);
/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update an existing teacher/faculty profile
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 */
router.put('/teachers/:id', verifyToken, updateTeacher);
router.get('/exams', verifyToken, getExams);
router.post('/exams', verifyToken, createExam);
router.put('/exams/:id', verifyToken, updateExam);
router.delete('/exams/:id', verifyToken, deleteExam);
router.put('/exams/:id/publish', verifyToken, publishExam);
router.put('/exams/:id/publish-results', verifyToken, publishResults);
router.put('/exams/:id/toggle-applications', verifyToken, toggleStudentApplication);

// Academic Milestones Routes
router.get('/milestones', verifyToken, getMilestones);
router.post('/milestones', verifyToken, createMilestone);
router.put('/milestones/:id', verifyToken, updateMilestone);
router.delete('/milestones/:id', verifyToken, deleteMilestone);

// Internal Exam Routes
router.get('/internal-exams/rounds', verifyToken, getRounds);
router.post('/internal-exams/rounds', verifyToken, createRound);
router.get('/internal-exams/schedules', verifyToken, getSchedules);
router.get('/internal-exams/available-contexts', verifyToken, getAvailableContexts);
router.post('/internal-exams/schedules', verifyToken, saveSchedules);

/**
 * @swagger
 * tags:
 *   name: Master Management
 *   description: Centralized master data administration (Semesters, Subjects, Programs, Policies)
 */

router.get('/marks', verifyToken, getMarks);

/**
 * @swagger
 * /api/master-semesters:
 *   get:
 *     summary: List all master semesters
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master semesters
 *   post:
 *     summary: Create a new master semester
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSemester'
 *     responses:
 *       201:
 *         description: Master semester created
 *
 * /api/master-semesters/{id}:
 *   put:
 *     summary: Update an existing master semester
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSemester'
 *     responses:
 *       200:
 *         description: Master semester updated
 *   delete:
 *     summary: Delete a master semester
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master semester deleted
 */
router.get('/master-semesters', verifyToken, getMasterSemesters);
router.get('/master-semesters/:id', verifyToken, getMasterSemester);
router.post('/master-semesters', verifyToken, createMasterSemester);
router.put('/master-semesters/:id', verifyToken, updateMasterSemester);
router.delete('/master-semesters/:id', verifyToken, deleteMasterSemester);

/**
 * @swagger
 * /api/master-subjects:
 *   get:
 *     summary: List all master subjects
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master subjects
 *   post:
 *     summary: Create a new master subject
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSubject'
 *     responses:
 *       201:
 *         description: Master subject created
 *
 * /api/master-subjects/{id}:
 *   put:
 *     summary: Update an existing master subject
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterSubject'
 *     responses:
 *       200:
 *         description: Master subject updated
 *   delete:
 *     summary: Delete a master subject
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master subject deleted
 */
router.get('/master-subjects', verifyToken, getMasterSubjects);
router.get('/master-subjects/:id', verifyToken, getMasterSubject);
router.post('/master-subjects', verifyToken, createMasterSubject);
router.put('/master-subjects/:id', verifyToken, updateMasterSubject);
router.delete('/master-subjects/:id', verifyToken, deleteMasterSubject);

/**
 * @swagger
 * /api/master-programs:
 *   get:
 *     summary: List all master programs
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master programs
 *   post:
 *     summary: Create a new master program
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterProgram'
 *     responses:
 *       201:
 *         description: Master program created
 *
 * /api/master-programs/{id}:
 *   put:
 *     summary: Update an existing master program
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MasterProgram'
 *     responses:
 *       200:
 *         description: Master program updated
 *   delete:
 *     summary: Delete a master program
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master program deleted
 */
router.get('/master-programs', verifyToken, getMasterPrograms);
router.get('/master-programs/:id', verifyToken, getMasterProgram);
router.post('/master-programs', verifyToken, createMasterProgram);
router.put('/master-programs/:id', verifyToken, updateMasterProgram);
router.delete('/master-programs/:id', verifyToken, deleteMasterProgram);

router.post('/students', verifyToken, createStudent);

/**
 * @swagger
 * /api/master-policies:
 *   get:
 *     summary: List all master policies
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master policies
 *   post:
 *     summary: Create a new master policy
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Master policy created
 *
 * /api/master-policies/{id}:
 *   put:
 *     summary: Update an existing master policy
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Master policy updated
 *   delete:
 *     summary: Delete a master policy
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master policy deleted
 */
router.get('/master-policies', verifyToken, getMasterPolicies);
router.get('/master-policies/:id', verifyToken, getMasterPolicy);
router.post('/master-policies', verifyToken, createMasterPolicy);
router.put('/master-policies/:id', verifyToken, updateMasterPolicy);
router.delete('/master-policies/:id', verifyToken, deleteMasterPolicy);

// college master policies - get policy for a college
router.get('/collage-master-policies/:collegeId', verifyToken, getCollegeMasterPolicy);

/**
 * @swagger
 * /api/master-teachers:
 *   get:
 *     summary: List all master teachers
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master teachers
 *   post:
 *     summary: Create a new master teacher
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       201:
 *         description: Master teacher created
 *
 * /api/master-teachers/{id}:
 *   put:
 *     summary: Update an existing master teacher
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Teacher'
 *     responses:
 *       200:
 *         description: Master teacher updated
 *   delete:
 *     summary: Delete a master teacher
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master teacher deleted
 */
router.get('/master-teachers', verifyToken, getMasterTeachers);
router.get('/master-teachers/:id', verifyToken, getMasterTeacher);
router.post('/master-teachers', verifyToken, createMasterTeacher);
router.put('/master-teachers/:id', verifyToken, updateMasterTeacher);
router.delete('/master-teachers/:id', verifyToken, deleteMasterTeacher);

/**
 * @swagger
 * /api/master-designations:
 *   get:
 *     summary: List all faculty designations
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of designations
 */
router.get('/master-designations', verifyToken, getMasterDesignations);
router.post('/master-designations', verifyToken, createMasterDesignation);

/**
 * @swagger
 * /api/master-departments:
 *   get:
 *     summary: List all master departments
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of master departments
 *   post:
 *     summary: Create a new master department
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_code: { type: string }
 *               department_name: { type: string }
 *               college_id: { type: integer }
 *     responses:
 *       201:
 *         description: Master department created
 *
 * /api/master-departments/{id}:
 *   put:
 *     summary: Update an existing master department
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_code: { type: string }
 *               department_name: { type: string }
 *               college_id: { type: integer }
 *     responses:
 *       200:
 *         description: Master department updated
 *   delete:
 *     summary: Delete a master department
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Master department deleted
 */
router.get('/master-departments', verifyToken, getMasterDepartments);
router.get('/master-departments/:id', verifyToken, getMasterDepartment);
router.post('/master-departments', verifyToken, createMasterDepartment);
router.put('/master-departments/:id', verifyToken, updateMasterDepartment);
router.delete('/master-departments/:id', verifyToken, deleteMasterDepartment);

/**
 * @swagger
 * /api/master-batches:
 *   get:
 *     summary: List all student admission batches
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of batches
 *   post:
 *     summary: Create a new admission batch
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch_name: { type: string }
 *               academic_year_id: { type: integer }
 *     responses:
 *       201:
 *         description: Batch created
 *
 * /api/master-batches/{id}:
 *   put:
 *     summary: Update an existing batch
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batch_name: { type: string }
 *     responses:
 *       200:
 *         description: Batch updated
 *   delete:
 *     summary: Delete a batch
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Batch deleted
 */
router.get('/master-batches', verifyToken, getMasterBatches);
router.post('/master-batches', verifyToken, createMasterBatch);
router.put('/master-batches/:id', verifyToken, updateMasterBatch);
router.delete('/master-batches/:id', verifyToken, deleteMasterBatch);

/**
 * @swagger
 * /api/subject-mappings:
 *   get:
 *     summary: List all subject mappings
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subject mappings
 *   post:
 *     summary: Create a new subject mapping
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               master_subject_id: { type: integer }
 *               program_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       201:
 *         description: Mapping created
 *
 * /api/subject-mappings/{id}:
 *   put:
 *     summary: Update an existing mapping
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semester_id: { type: integer }
 *     responses:
 *       200:
 *         description: Mapping updated
 *   delete:
 *     summary: Delete a mapping
 *     tags: [Master Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mapping deleted
 */
router.get('/subject-mappings', verifyToken, getSubjectMappings);
router.post('/subject-mappings', verifyToken, createSubjectMapping);
router.put('/subject-mappings/:id', verifyToken, updateSubjectMapping);
router.delete('/subject-mappings/:id', verifyToken, deleteSubjectMapping);


/**
 * @swagger
 * /api/marks/students:
 *   get:
 *     summary: Get students for class marks entry
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students for marks entry
 */
router.get('/marks/students', verifyToken, getStudentsForMarks);

/**
 * @swagger
 * /api/marks/teacher-save:
 *   post:
 *     summary: Save internal marks as a draft (Teacher)
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marks saved
 */
router.post('/marks/teacher-save', verifyToken, saveTeacherMarks);

/**
 * @swagger
 * /api/marks/approvals:
 *   get:
 *     summary: Get internal marks awaiting HOD approval
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/marks/approvals', verifyToken, getMarksForApproval);

/**
 * @swagger
 * /api/marks/approve-reject:
 *   post:
 *     summary: Approve or reject a batch of internal marks (HOD)
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/marks/approve-reject', verifyToken, approveRejectMarks);

/**
 * @swagger
 * tags:
 *   name: Examinations
 *   description: Exam scheduling and result management
 */

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: List all exams
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of exams
 *   post:
 *     summary: Create a new exam schedule
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: Exam created
 *
 * /api/exams/{id}:
 *   put:
 *     summary: Update an existing exam schedule
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       200:
 *         description: Exam updated
 *   delete:
 *     summary: Delete an exam schedule
 *     tags: [Examinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam deleted
 */
router.get('/exams', verifyToken, getExams);
router.post('/exams', verifyToken, createExam);
router.put('/exams/:id', verifyToken, updateExam);
router.delete('/exams/:id', verifyToken, deleteExam);
router.put('/exams/:id/publish', verifyToken, publishExam);
router.put('/exams/:id/publish-results', verifyToken, publishResults);
router.put('/exams/:id/toggle-applications', verifyToken, toggleStudentApplication);

// Marks Management (60/40 Split and HOD Approval) module
router.get('/marks/students', verifyToken, getStudentsForMarks);
router.post('/marks/teacher-save', verifyToken, saveTeacherMarks);
router.get('/marks/approvals', verifyToken, getMarksForApproval);
router.post('/marks/approve-reject', verifyToken, approveRejectMarks);

// Student Exam endpoints
/**
 * @swagger
 * /api/student/exams:
 *   get:
 *     summary: Get available exams for the logged-in student
 *     tags: [Student Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available exams
 */
router.get('/student/exams', verifyToken, getStudentExams);

/**
 * @swagger
 * /api/student/results:
 *   get:
 *     summary: Get student results
 *     tags: [Student Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student result data
 */
router.get('/student/results', verifyToken, getStudentResults);
router.get('/student/attendance', verifyToken, getStudentAttendance);
router.get('/student/attendance-detail/:subjectId', verifyToken, getStudentAttendanceDetail);
router.get('/student/attendance-history', verifyToken, getStudentAttendanceHistory);
/**
 * @swagger
 * /api/student/hall-ticket/{examName}/{semesterId}:
 *   get:
 *     summary: Generate hall ticket data for a specific exam and semester
 *     tags: [Student Services]
 *     parameters:
 *       - in: path
 *         name: examName
 *         required: true
 *       - in: path
 *         name: semesterId
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.get('/student/hall-ticket/:examName/:semesterId', verifyToken, getHallTicketData);

/**
 * @swagger
 * /api/student/result-sheet/{examName}:
 *   get:
 *     summary: Get combined result sheet for an exam
 *     tags: [Student Services]
 *     parameters:
 *       - in: path
 *         name: examName
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.get('/student/result-sheet/:examName', verifyToken, getResultSheetData);

/**
 * @swagger
 * /api/student/exams/register:
 *   post:
 *     summary: Register for an upcoming exam
 *     tags: [Student Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examId: { type: integer }
 *               subjectIds: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Registration successful
 */
router.post('/student/exams/register', verifyToken, registerForExam);

// SMTP Config endpoints
/**
 * @swagger
 * /api/config/smtp:
 *   get:
 *     summary: Get outgoing email configuration
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SMTP settings
 */
router.get('/config/smtp', verifyToken, getSmtpConfig);

/**
 * @swagger
 * /api/config/smtp:
 *   post:
 *     summary: Update outgoing email configuration
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.post('/config/smtp', verifyToken, updateSmtpConfig);

// --- Seating Arrangement Routes ---
router.get('/college-admin/seating-arrangements', verifyToken, getSeatingArrangements);
router.post('/college-admin/auto-allocate-seats', verifyToken, autoAllocateSeats);
router.post('/college-admin/clear-seating-assignments', verifyToken, clearAssignments);
router.post('/college-admin/lock-seating', verifyToken, lockSeating);


module.exports = router;