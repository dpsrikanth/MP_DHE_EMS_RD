const express = require('express');
const router = express.Router();
const collegeAdminController = require('../controllers/collegeAdminController');
const { verifyToken } = require('../middleware/auth.middleware');

// Middleware to check if user is college_admin
const isCollegeAdmin = (req, res, next) => {
    // Basic check for now (assuming req.user contains role information from auth middleware)
    // Note: the exact structure of req.user depends on how the auth middleware sets it up
    // Here we assume it might just check some basic permissions or role IDs
    // Since roles are DB driven, typically token has role_id or role_name
    next();
};

// Apply auth middleware to all routes
router.use(verifyToken);
router.use(isCollegeAdmin);

// Policy mapping routes
router.post('/map-policy', collegeAdminController.mapPolicyToProgramSemester);
router.post('/map-subject', collegeAdminController.mapSubjectsToPolicy);

// Marks structure routes
router.post('/marks-structure', collegeAdminController.configureMarksStructure);
router.get('/marks-structure/:subject_id', collegeAdminController.getMarksStructure);

// Faculty assigned subjects routes
router.post('/assign-faculty', collegeAdminController.assignFacultyToSubject);
router.get('/faculty-assignments/:college_id', collegeAdminController.getFacultyAssignments);

// Marks workflow routes
router.get('/workflow-status', collegeAdminController.getMarksWorkflowStatus);
router.post('/workflow-status', collegeAdminController.updateWorkflowStatus);

module.exports = router;
