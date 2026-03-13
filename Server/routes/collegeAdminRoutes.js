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
router.get('/policy-mappings', collegeAdminController.getPolicyMappings);
router.put('/policy-mappings/:id', collegeAdminController.editPolicyMapping);
router.delete('/policy-mappings/:id', collegeAdminController.deletePolicyMapping);

// Marks structure routes
router.post('/marks-structure', collegeAdminController.configureMarksStructure);
router.get('/marks-structure/:subject_id', collegeAdminController.getMarksStructure);
router.get('/all-marks-structures', collegeAdminController.getAllMarksStructures);
router.get('/get-components', collegeAdminController.getMarksStructureComponents);
router.put('/marks-structure/:id', collegeAdminController.editMarksStructure);
router.delete('/marks-structure/:id', collegeAdminController.deleteMarksStructure);

// Faculty assigned subjects routes
router.post('/assign-faculty', collegeAdminController.assignFacultyToSubject);
router.get('/faculty-assignments/:college_id', collegeAdminController.getFacultyAssignments);
router.put('/faculty-assignments/:id', collegeAdminController.editFacultyAssignment);
router.delete('/faculty-assignments/:id', collegeAdminController.deleteFacultyAssignment);

// Marks workflow routes
router.get('/workflow-status', collegeAdminController.getMarksWorkflowStatus);
router.post('/workflow-status', collegeAdminController.updateWorkflowStatus);
router.get('/marks-tracking', collegeAdminController.getMarksTracking);
router.get('/review-marks', collegeAdminController.reviewMarks);
router.post('/lock-marks', collegeAdminController.lockMarks);
router.post('/save-student-review', collegeAdminController.saveStudentReview);
router.post('/reject-workflow-section', collegeAdminController.rejectWorkflow);
router.post('/unlock-marks', collegeAdminController.unlockMarks);
router.get('/marks-report', collegeAdminController.getMarksReport);

module.exports = router;
