const express = require('express');
const router = express.Router();
const { register, getDashboardStats, getUsers, getPrograms, getSubjects,addTeacher, getAcademicYears, getSemesters, getExamTypes, getRoles, Login, getUniversities, createUniversity, updateUniversity, deleteUniversity, createCollege, updateCollege, deleteCollege, createProgram, updateProgram, deleteProgram, createAcademicYear, updateAcademicYear, deleteAcademicYear, getStudents, createStudent, updateStudent, deleteStudent, getColleges, getTeachers, updateTeacher, getExams, getMarks,getDropdownOptions } = require('../controllers/controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.get('/roles', getRoles);
router.post('/login', Login);
// Dashboard endpoints
router.get('/dashboard/stats', verifyToken, getDashboardStats);
router.get('/users', verifyToken, getUsers);
router.get('/programs', verifyToken, getPrograms);
router.get('/subjects', verifyToken, getSubjects);
router.get('/academic-years', verifyToken, getAcademicYears);
router.get('/semesters', verifyToken, getSemesters);
router.get('/exam-types', verifyToken, getExamTypes);
router.get('/universities', verifyToken, getUniversities);
router.post('/universities', verifyToken, createUniversity);
router.put('/universities/:id', verifyToken, updateUniversity);
router.delete('/universities/:id', verifyToken, deleteUniversity);
router.get('/colleges', verifyToken, getColleges);
router.post('/colleges', verifyToken, createCollege);
router.put('/colleges/:id', verifyToken, updateCollege);
router.delete('/colleges/:id', verifyToken, deleteCollege);
router.get('/programs', verifyToken, getPrograms);
router.post('/programs', verifyToken, createProgram);
router.put('/programs/:id', verifyToken, updateProgram);
router.delete('/programs/:id', verifyToken, deleteProgram);
router.get('/academic-years', verifyToken, getAcademicYears);
router.post('/academic-years', verifyToken, createAcademicYear);
router.put('/academic-years/:id', verifyToken, updateAcademicYear);
router.delete('/academic-years/:id', verifyToken, deleteAcademicYear);
router.get('/students', verifyToken, getStudents);
router.post('/students', verifyToken, createStudent);
router.put('/students/:id', verifyToken, updateStudent);
router.delete('/students/:id', verifyToken, deleteStudent);
router.get('/teachers', verifyToken, getTeachers);
router.post('/teachers', verifyToken, addTeacher);
router.put('/teachers/:id', verifyToken, updateTeacher);
// router.delete('/teachers/:id', verifyToken, deleteTeacher);
router.get('/exams', verifyToken, getExams);
router.get('/marks', verifyToken, getMarks);
router.get("/masterDetails",verifyToken,getDropdownOptions)

module.exports = router;