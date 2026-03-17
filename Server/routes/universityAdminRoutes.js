const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { 
    getFacultiesForExternal, 
    getRegistrationsPendingAssignment, 
    assignExternalFaculty, 
    getExternalAssignments,
    getFinalizedExternalMarks
} = require('../controllers/universityAdminController');

router.get('/external-faculties', verifyToken, getFacultiesForExternal);
router.get('/pending-external-assignments', verifyToken, getRegistrationsPendingAssignment);
router.post('/assign-external-faculty', verifyToken, assignExternalFaculty);
router.get('/external-assignments', verifyToken, getExternalAssignments);
router.get('/finalized-external-marks', verifyToken, getFinalizedExternalMarks);

module.exports = router;
