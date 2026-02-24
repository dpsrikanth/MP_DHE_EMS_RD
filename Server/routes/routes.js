const express = require('express');
const router = express.Router();
const { register, getDashboardStats, getUsers, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles,Login } = require('../controllers/controller');

router.post('/register', register);
router.get('/roles', getRoles);
router.post('/login', Login);
// Dashboard endpoints
router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/programs', getPrograms);
router.get('/subjects', getSubjects);
router.get('/academic-years', getAcademicYears);
router.get('/semesters', getSemesters);
router.get('/exam-types', getExamTypes);

module.exports = router;