const express = require('express');
const router = express.Router();
const { register, getDashboardStats, getUsers, getPrograms, getSubjects, getAcademicYears, getSemesters, getExamTypes, getRoles, Login, refreshToken, getUniversities, createUniversity, updateUniversity, deleteUniversity, createCollege, updateCollege, deleteCollege, createProgram, updateProgram, deleteProgram, createAcademicYear, updateAcademicYear, deleteAcademicYear, getStudents, getColleges, getTeachers, updateTeacher, getExams, getMarks , getMasterSemesters, createMasterSemester, updateMasterSemester, deleteMasterSemester, getMasterSemester, getMasterSubjects, createMasterSubject, updateMasterSubject, deleteMasterSubject, getMasterSubject, getMasterPrograms, createMasterProgram, getMasterProgram, updateMasterProgram, deleteMasterProgram, getMasterPolicies, getMasterPolicy, createMasterPolicy, updateMasterPolicy, deleteMasterPolicy,createStudent} = require('../controllers/controller');
const { getMasters, getUniversityConfig, updateUniversityConfig, getCollegeConfig, updateCollegeConfig } = require('../controllers/masterController');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.get('/roles', getRoles);
router.post('/login', Login);
router.post('/refresh-token', refreshToken);
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

router.get('/masters', verifyToken, getMasters);
router.get('/universities/:id/config', verifyToken, getUniversityConfig);
router.put('/universities/:id/config', verifyToken, updateUniversityConfig);

router.get('/colleges', verifyToken, getColleges);
router.post('/colleges', verifyToken, createCollege);
router.put('/colleges/:id', verifyToken, updateCollege);
router.delete('/colleges/:id', verifyToken, deleteCollege);
router.get('/colleges/:id/config', verifyToken, getCollegeConfig);
router.put('/colleges/:id/config', verifyToken, updateCollegeConfig);
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
router.put('/teachers/:id', verifyToken, updateTeacher);
// router.delete('/teachers/:id', verifyToken, deleteTeacher);
router.get('/exams', verifyToken, getExams);
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

module.exports = router;