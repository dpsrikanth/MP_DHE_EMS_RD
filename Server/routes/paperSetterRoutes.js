const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paperSetterController = require('../controllers/paperSetterController');
const { verifyToken } = require('../middleware/auth.middleware.js');

const tmpDir = path.join(__dirname, '../uploads/tmp');
const fs = require('fs');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => cb(null, 'tmp_' + Date.now() + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, and Images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(verifyToken);

// Role Middleware
const checkRole = (roles) => (req, res, next) => {
  const userRole = req.user?.roleName || req.user?.role || '';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges.' });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Paper Setting Workflow
 *   description: Endpoints for HODs to assign paper sets, Faculty to upload, and Chief Examiners to finalize
 */

// HOD Endpoints
/**
 * @swagger
 * /api/paper-setter/hod/form-data:
 *   get:
 *     summary: Get required form data for assigning a paper set (HOD)
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/hod/form-data', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.getHODFormData);

/**
 * @swagger
 * /api/paper-setter/hod/assign:
 *   post:
 *     summary: Assign a faculty member to a specific paper set
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/hod/assign', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.assignSet);

/**
 * @swagger
 * /api/paper-setter/hod/assignments:
 *   get:
 *     summary: Get all paper set assignments for the HOD's department
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/hod/assignments', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.getAssignmentsByHOD);

// Faculty Endpoints
/**
 * @swagger
 * /api/paper-setter/faculty/check-assigned:
 *   get:
 *     summary: Check if the logged-in faculty is assigned to any paper sets
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/faculty/check-assigned', checkRole(['Faculty', 'Teacher', 'External Faculty', 'PAPER_SETTER']), paperSetterController.checkIfAssigned);

/**
 * @swagger
 * /api/paper-setter/faculty/assignments:
 *   get:
 *     summary: Get detailed assignment list for paper setter
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/faculty/assignments', checkRole(['Faculty', 'Teacher', 'External Faculty', 'PAPER_SETTER']), paperSetterController.getFacultyAssignments);

/**
 * @swagger
 * /api/paper-setter/faculty/dash-data:
 *   get:
 *     summary: Get assignments and status for the logged-in paper setter
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/faculty/dash-data', checkRole(['Faculty', 'Teacher', 'External Faculty', 'PAPER_SETTER']), paperSetterController.getSetterDashData);

/**
 * @swagger
 * /api/paper-setter/faculty/upload:
 *   post:
 *     summary: Upload a question paper set
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               paperFile: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Paper uploaded successfully
 */
router.post('/faculty/upload', checkRole(['Faculty', 'Teacher', 'External Faculty', 'PAPER_SETTER']), upload.single('paperFile'), paperSetterController.uploadPaper);

// Chief Examiner Endpoints (admin/super_admin/HOD)
/**
 * @swagger
 * /api/paper-setter/chief/dashboard:
 *   get:
 *     summary: Get dashboard for paper review and decryption
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review dashboard data
 */
router.get('/chief/dashboard', checkRole(['admin', 'SUPER_ADMIN', 'college_admin', 'HOD']), paperSetterController.getReviewDashboard);

/**
 * @swagger
 * /api/paper-setter/chief/finalize:
 *   post:
 *     summary: Finalize or reject a submitted question paper (Chief Examiner)
 *     tags: [Paper Setting Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/chief/finalize', checkRole(['admin', 'SUPER_ADMIN', 'college_admin', 'HOD']), paperSetterController.finalizePaper);

/**
 * @swagger
 * /api/paper-setter/download/{paper_id}:
 *   get:
 *     summary: Download an encrypted question paper file
 *     tags: [Paper Setting Workflow]
 *     parameters:
 *       - in: path
 *         name: paper_id
 *         required: true
 *     security:
 *       - bearerAuth: []
 */
router.get('/download/:paper_id', paperSetterController.downloadPaper);

module.exports = router;
