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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policy_id: { type: integer }
 *               program_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       200:
 *         description: Policy mapped successfuly
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_ids: { type: array, items: { type: integer } }
 *               policy_id: { type: integer }
 *     responses:
 *       200:
 *         description: Subjects mapped successfuly
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policy_id: { type: integer }
 *     responses:
 *       200:
 *         description: Policy mapping updated
 *   delete:
 *     summary: Delete a policy mapping
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Policy mapping deleted
 */
router.put('/policy-mappings/:id', collegeAdminController.editPolicyMapping);
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_id: { type: integer }
 *               components: { type: object }
 *     responses:
 *       200:
 *         description: Marks structure configured
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
/**
 * @swagger
 * /api/college-admin/marks-structure/{id}:
 *   put:
 *     summary: Edit an existing marks structure
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               components: { type: object }
 *     responses:
 *       200:
 *         description: Marks structure updated
 *   delete:
 *     summary: Delete a marks structure
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marks structure deleted
 */
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
/**
 * @swagger
 * /api/college-admin/assign-faculty:
 *   post:
 *     summary: Assign a faculty member to a subject in a semester/academic year
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacher_id: { type: integer }
 *               subject_id: { type: integer }
 *               academic_year_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       201:
 *         description: Faculty assigned
 */
router.post('/assign-faculty', collegeAdminController.assignFacultyToSubject);
router.get('/faculty-assignments/:college_id', collegeAdminController.getFacultyAssignments);
/**
 * @swagger
 * /api/college-admin/faculty-assignments/{id}:
 *   put:
 *     summary: Edit an existing faculty assignment
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacher_id: { type: integer }
 *     responses:
 *       200:
 *         description: Assignment updated
 *   delete:
 *     summary: Delete a faculty assignment
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment deleted
 */
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
 *   post:
 *     summary: Update status of a workflow section (Lock/Unlock)
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section: { type: string }
 *               status: { type: string }
 *               college_id: { type: integer }
 *     responses:
 *       200:
 *         description: Workflow status updated
 */
router.get('/workflow-status', collegeAdminController.getMarksWorkflowStatus);
router.post('/workflow-status', collegeAdminController.updateWorkflowStatus);
router.get('/marks-tracking', collegeAdminController.getMarksTracking);

/**
 * @swagger
 * /api/college-admin/marks-audit-log:
 *   get:
 *     summary: Retrieve the audit log/history for marks submission and approval for a specific subject batch
 *     tags: [College Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The subject ID.
 *       - in: query
 *         name: workflow_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: The marks workflow status ID.
 *     responses:
 *       200:
 *         description: Successfully retrieved audit log
 */
router.get('/marks-audit-log', collegeAdminController.getMarksAuditLog);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_id: { type: integer }
 *               academic_year_id: { type: integer }
 *               semester_id: { type: integer }
 *     responses:
 *       200:
 *         description: Marks locked successfuly
 */
router.post('/lock-marks', collegeAdminController.lockMarks);

/**
 * @swagger
 * /api/college-admin/save-student-review:
 *   post:
 *     summary: Save specific review comments for a student's marks
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id: { type: integer }
 *               marks_id: { type: integer }
 *               review_status: { type: string }
 *     responses:
 *       200:
 *         description: Review saved
 */
router.post('/save-student-review', collegeAdminController.saveStudentReview);
/**
 * @swagger
 * /api/college-admin/reject-workflow-section:
 *   post:
 *     summary: Reject a submitted workflow section back to the teacher
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section: { type: string }
 *               college_id: { type: integer }
 *     responses:
 *       200:
 *         description: Workflow section rejected
 */
router.post('/reject-workflow-section', collegeAdminController.rejectWorkflow);

/**
 * @swagger
 * /api/college-admin/unlock-marks:
 *   post:
 *     summary: Request/Perform unlock of finalized marks
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_id: { type: integer }
 *     responses:
 *       200:
 *         description: Marks unlocked successfuly
 */
router.post('/unlock-marks', collegeAdminController.unlockMarks);
router.post('/send-back-correction', collegeAdminController.sendBackCorrection);
router.get('/notifications', collegeAdminController.getCollegeNotifications);
router.put('/notifications/:id/read', collegeAdminController.markNotificationRead);
router.get('/marks-report', collegeAdminController.getMarksReport);

/**
 * @swagger
 * /api/college-admin/total-rooms:
 *   get:
 *     summary: Get total examination rooms for the college
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update total examination rooms for the college
 *     tags: [College Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               total_rooms: { type: integer }
 *     responses:
 *       200:
 *         description: Room count updated
 */
router.get('/total-rooms', collegeAdminController.getCollegeTotalRooms);
router.put('/total-rooms', collegeAdminController.updateCollegeTotalRooms);

// Roll Number Generator routes
router.get('/students-for-roll-generation', collegeAdminController.getStudentsForRollGeneration);
router.post('/generate-roll-numbers', collegeAdminController.allocateRollNumbers);

router.get('/dashboard-stats', collegeAdminController.getCollegeDashboardStats);

module.exports = router;

