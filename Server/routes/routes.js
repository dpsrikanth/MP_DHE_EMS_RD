const express = require('express');
const router = express.Router();
const { register, getDashboardStats, getUsers, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles,Login ,getUniversities,getStudents} = require('../controllers/controller');
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
router.get('/students', verifyToken, getStudents);

module.exports = router;