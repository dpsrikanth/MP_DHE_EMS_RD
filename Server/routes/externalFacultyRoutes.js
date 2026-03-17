const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { 
    getAssignedStudents, 
    saveExternalMarks, 
    finalizeExternalMarks 
} = require('../controllers/externalFacultyController');

router.get('/assignments', verifyToken, getAssignedStudents);
router.post('/save-marks', verifyToken, saveExternalMarks);
router.post('/finalize-marks', verifyToken, finalizeExternalMarks);

module.exports = router;
