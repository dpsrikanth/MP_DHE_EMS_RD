const express = require('express');
const router = express.Router();
const { register, getDashboardStats, getUsers, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles, Login, getUniversities, createUniversity, updateUniversity, deleteUniversity, createCollege, updateCollege, deleteCollege, createProgram, updateProgram, deleteProgram, createAcademicYear, updateAcademicYear, deleteAcademicYear, getStudents, getColleges, getTeachers, getExams, getMarks } = require('../controllers/controller');
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
router.get('/teachers', verifyToken, getTeachers);
router.get('/exams', verifyToken, getExams);
router.get('/marks', verifyToken, getMarks);

module.exports = router;