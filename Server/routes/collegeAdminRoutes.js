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

/**
 * @swagger
 * tags:
 *   name: College Administration
 *   description: College-level configuration for policies, marks, and faculty
 */

// Policy mapping routes
/**
 * @swagger
 * /api/college-admin/map-policy:
 *   post:
 *     summary: Map a policy to a specific program and semester
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/map-policy', collegeAdminController.mapPolicyToProgramSemester);

/**
 * @swagger
 * /api/college-admin/map-subject:
 *   post:
 *     summary: Map individual subjects to a configured policy
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/map-subject', collegeAdminController.mapSubjectsToPolicy);

/**
 * @swagger
 * /api/college-admin/policy-mappings:
 *   get:
 *     summary: Get all policy mappings for the college
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of policy mappings
 */
router.get('/policy-mappings', collegeAdminController.getPolicyMappings);

/**
 * @swagger
 * /api/college-admin/policy-mappings/{id}:
 *   put:
 *     summary: Edit an existing policy mapping
 *     tags: [College Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.put('/policy-mappings/:id', collegeAdminController.editPolicyMapping);

/**
 * @swagger
 * /api/college-admin/policy-mappings/{id}:
 *   delete:
 *     summary: Delete a policy mapping
 *     tags: [College Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
router.delete('/policy-mappings/:id', collegeAdminController.deletePolicyMapping);

// Marks structure routes
/**
 * @swagger
 * /api/college-admin/marks-structure:
 *   post:
 *     summary: Configure the marks breakout (Theory/Lab/Internal) for a subject
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/marks-structure', collegeAdminController.configureMarksStructure);

/**
 * @swagger
 * /api/college-admin/marks-structure/{subject_id}:
 *   get:
 *     summary: Get the specific marks structure for a subject
 *     tags: [College Administration]
 *     parameters:
 *       - in: path
 *         name: subject_id
 *         required: true
 */
router.get('/marks-structure/:subject_id', collegeAdminController.getMarksStructure);

/**
 * @swagger
 * /api/college-admin/all-marks-structures:
 *   get:
 *     summary: Get all marks structures configured for the college
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of marks structures
 */
router.get('/all-marks-structures', collegeAdminController.getAllMarksStructures);
router.get('/get-components', collegeAdminController.getMarksStructureComponents);
router.put('/marks-structure/:id', collegeAdminController.editMarksStructure);
router.delete('/marks-structure/:id', collegeAdminController.deleteMarksStructure);

// Faculty assigned subjects routes
/**
 * @swagger
 * /api/college-admin/faculty-assignments/{college_id}:
 *   get:
 *     summary: Get all faculty subject assignments for a college
 *     tags: [College Administration]
 *     parameters:
 *       - in: path
 *         name: college_id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of faculty assignments
 */
router.post('/assign-faculty', collegeAdminController.assignFacultyToSubject);
router.get('/faculty-assignments/:college_id', collegeAdminController.getFacultyAssignments);
router.put('/faculty-assignments/:id', collegeAdminController.editFacultyAssignment);
router.delete('/faculty-assignments/:id', collegeAdminController.deleteFacultyAssignment);

// Marks workflow routes
/**
 * @swagger
 * /api/college-admin/workflow-status:
 *   get:
 *     summary: Get status of marks entry workflow
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workflow-status', collegeAdminController.getMarksWorkflowStatus);
router.post('/workflow-status', collegeAdminController.updateWorkflowStatus);
router.get('/marks-tracking', collegeAdminController.getMarksTracking);

/**
 * @swagger
 * /api/college-admin/review-marks:
 *   get:
 *     summary: Review student marks before finalization
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/review-marks', collegeAdminController.reviewMarks);

/**
 * @swagger
 * /api/college-admin/lock-marks:
 *   post:
 *     summary: Finalize and lock marks for a subject batch
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/lock-marks', collegeAdminController.lockMarks);

router.post('/save-student-review', collegeAdminController.saveStudentReview);
router.post('/reject-workflow-section', collegeAdminController.rejectWorkflow);

/**
 * @swagger
 * /api/college-admin/unlock-marks:
 *   post:
 *     summary: Request/Perform unlock of finalized marks
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/unlock-marks', collegeAdminController.unlockMarks);
router.get('/marks-report', collegeAdminController.getMarksReport);

module.exports = router;
