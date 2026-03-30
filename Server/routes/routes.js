const express = require('express');
const router = express.Router();
const { register, changePassword, getDashboardStats, getUsers, createUser, updateUser, deleteUser, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles, createRole, updateRole, deleteRole, Login, refreshToken, getUniversities, createUniversity, updateUniversity, deleteUniversity, createCollege, updateCollege, deleteCollege, createProgram, updateProgram, deleteProgram, createAcademicYear, updateAcademicYear, deleteAcademicYear, getStudents, getColleges, getTeachers, updateTeacher, getExams, createExam, updateExam, deleteExam, publishExam, toggleStudentApplication, getMarks , getMasterSemesters, createMasterSemester, updateMasterSemester, deleteMasterSemester, getMasterSemester, getMasterSubjects, createMasterSubject, updateMasterSubject, deleteMasterSubject, getMasterSubject, getMasterPrograms, createMasterProgram, getMasterProgram, updateMasterProgram, deleteMasterProgram, getMasterPolicies, getMasterPolicy, createMasterPolicy, updateMasterPolicy, deleteMasterPolicy, getCollegeMasterPolicy, createStudent, updateStudent, deleteStudent, getMasterTeachers, getMasterTeacher, createMasterTeacher, updateMasterTeacher, deleteMasterTeacher, getMasterDesignations, createMasterDesignation, getMasterDepartments, createMasterDepartment, getCollegeSemesters, getCollegePrograms, getCollegePolicies, getCollegeAcademicYears,getMasterDepartment, updateMasterDepartment, deleteMasterDepartment, getStudentsForMarks, saveTeacherMarks, getMarksForApproval, approveRejectMarks, getMasterBatches, createMasterBatch, updateMasterBatch, deleteMasterBatch, getSubjectMappings, createSubjectMapping, updateSubjectMapping, deleteSubjectMapping, getStudentExams, registerForExam, publishResults, getStudentResults, getHallTicketData, getResultSheetData, forgotPassword, resetPassword, mapMasterProgram, unmapMasterProgram, mapMasterSemester, unmapMasterSemester, mapMasterAcademicYear, unmapMasterAcademicYear, mapMasterPolicy, unmapMasterPolicy } = require('../controllers/controller');
const { getMasters, getUniversityConfig, updateUniversityConfig, getCollegeConfig, updateCollegeConfig } = require('../controllers/masterController');
const { getSmtpConfig, updateSmtpConfig } = require('../controllers/configController');
const { verifyToken } = require('../middleware/auth.middleware');

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
router.post('/register', register);

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
router.post('/roles', verifyToken, createRole);
router.put('/roles/:id', verifyToken, updateRole);
router.delete('/roles/:id', verifyToken, deleteRole);

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
router.post('/login', Login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

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
router.get('/programs', verifyToken, getPrograms);
/**
 * @swagger
 * /api/programs:
 *   post:
 *     summary: Create a new academic program
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Program created
 */
router.post('/programs', verifyToken, createProgram);
router.put('/programs/:id', verifyToken, updateProgram);
router.delete('/programs/:id', verifyToken, deleteProgram);
/**
 * @swagger
 * /api/academic-years:
 *   get:
 *     summary: Get all academic years
 *     tags: [Academic Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of academic years
 */
router.get('/academic-years', verifyToken, getAcademicYears);
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
router.post('/students', verifyToken, createStudent);
router.put('/students/:id', verifyToken, updateStudent);
router.delete('/students/:id', verifyToken, deleteStudent);

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
router.put('/teachers/:id', verifyToken, updateTeacher);
router.get('/exams', verifyToken, getExams);
router.post('/exams', verifyToken, createExam);
router.put('/exams/:id', verifyToken, updateExam);
router.delete('/exams/:id', verifyToken, deleteExam);
router.put('/exams/:id/publish', verifyToken, publishExam);
router.put('/exams/:id/publish-results', verifyToken, publishResults);
router.put('/exams/:id/toggle-applications', verifyToken, toggleStudentApplication);

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
 */
router.get('/exams', verifyToken, getExams);
router.post('/exams', verifyToken, createExam);
router.put('/exams/:id', verifyToken, updateExam);
router.delete('/exams/:id', verifyToken, deleteExam);
router.put('/exams/:id/publish', verifyToken, publishExam);
router.put('/exams/:id/publish-results', verifyToken, publishResults);
router.put('/exams/:id/toggle-applications', verifyToken, toggleStudentApplication);

router.get('/marks', verifyToken, getMarks);
  router.get('/master-semesters', verifyToken, getMasterSemesters);
router.get('/master-semesters/:id', verifyToken, getMasterSemester);
router.post('/master-semesters', verifyToken, createMasterSemester);
router.put('/master-semesters/:id', verifyToken, updateMasterSemester);
router.delete('/master-semesters/:id', verifyToken, deleteMasterSemester);

// master subjects manage
router.get('/master-subjects', verifyToken, getMasterSubjects);
router.get('/master-subjects/:id', verifyToken, getMasterSubject);
router.post('/master-subjects', verifyToken, createMasterSubject);
router.put('/master-subjects/:id', verifyToken, updateMasterSubject);
router.delete('/master-subjects/:id', verifyToken, deleteMasterSubject);

// master programs manage
router.get('/master-programs', verifyToken, getMasterPrograms);
router.get('/master-programs/:id', verifyToken, getMasterProgram);
router.post('/master-programs', verifyToken, createMasterProgram);
router.put('/master-programs/:id', verifyToken, updateMasterProgram);
router.delete('/master-programs/:id', verifyToken, deleteMasterProgram);

router.post('/students', verifyToken, createStudent);

// master policies manage
router.get('/master-policies', verifyToken, getMasterPolicies);
router.get('/master-policies/:id', verifyToken, getMasterPolicy);
router.post('/master-policies', verifyToken, createMasterPolicy);
router.put('/master-policies/:id', verifyToken, updateMasterPolicy);
router.delete('/master-policies/:id', verifyToken, deleteMasterPolicy);

// University Admin Mapping Routes
router.post('/master-programs/map', verifyToken, mapMasterProgram);
router.delete('/master-programs/unmap/:id', verifyToken, unmapMasterProgram);
router.post('/master-semesters/map', verifyToken, mapMasterSemester);
router.delete('/master-semesters/unmap/:id', verifyToken, unmapMasterSemester);
router.post('/master-academic-years/map', verifyToken, mapMasterAcademicYear);
router.delete('/master-academic-years/unmap/:id', verifyToken, unmapMasterAcademicYear);
router.post('/master-policies/map', verifyToken, mapMasterPolicy);
router.delete('/master-policies/unmap/:id', verifyToken, unmapMasterPolicy);

// college master policies - get policy for a college
router.get('/collage-master-policies/:collegeId', verifyToken, getCollegeMasterPolicy);

// master teachers manage
router.get('/master-teachers', verifyToken, getMasterTeachers);
router.get('/master-teachers/:id', verifyToken, getMasterTeacher);
router.post('/master-teachers', verifyToken, createMasterTeacher);
router.put('/master-teachers/:id', verifyToken, updateMasterTeacher);
router.delete('/master-teachers/:id', verifyToken, deleteMasterTeacher);

// master designations manage
router.get('/master-designations', verifyToken, getMasterDesignations);
router.post('/master-designations', verifyToken, createMasterDesignation);

// master departments manage
router.get('/master-departments', verifyToken, getMasterDepartments);
router.get('/master-departments/:id', verifyToken, getMasterDepartment);
router.post('/master-departments', verifyToken, createMasterDepartment);
router.put('/master-departments/:id', verifyToken, updateMasterDepartment);
router.delete('/master-departments/:id', verifyToken, deleteMasterDepartment);

// master batches manage
router.get('/master-batches', verifyToken, getMasterBatches);
router.post('/master-batches', verifyToken, createMasterBatch);
router.put('/master-batches/:id', verifyToken, updateMasterBatch);
router.delete('/master-batches/:id', verifyToken, deleteMasterBatch);

// master subject mapping
router.get('/subject-mappings', verifyToken, getSubjectMappings);
router.post('/subject-mappings', verifyToken, createSubjectMapping);
router.put('/subject-mappings/:id', verifyToken, updateSubjectMapping);
router.delete('/subject-mappings/:id', verifyToken, deleteSubjectMapping);


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

module.exports = router;