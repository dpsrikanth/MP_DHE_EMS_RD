const express = require('express');
const router = express.Router();
const facultyMarksController = require('../controllers/facultyMarksController');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// Faculty check middleware could be added here
const isFaculty = (req, res, next) => {
    next();
};
router.use(isFaculty);

// Fetch assigned subjects
router.get('/assigned-subjects/:teacher_id', facultyMarksController.getAssignedSubjects);

// Fetch students for a specific program/semester
router.get('/students', facultyMarksController.getStudentsForSubject);

// Fetch previously entered marks
router.get('/entered-marks', facultyMarksController.getEnteredMarks);

// Save marks 
router.post('/enter-marks', facultyMarksController.enterStudentMarks);

module.exports = router;
