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
const upload = multer({ storage });

router.use(verifyToken);

// Role Middleware
const checkRole = (roles) => (req, res, next) => {
  const userRole = req.user?.roleName || req.user?.role || '';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges.' });
  }
  next();
};

// HOD Endpoints
router.get('/hod/form-data', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.getHODFormData);
router.post('/hod/assign', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.assignSet);
router.get('/hod/assignments', checkRole(['HOD', 'admin', 'college_admin']), paperSetterController.getAssignmentsByHOD);

// Faculty Endpoints
router.get('/faculty/check-assigned', checkRole(['Faculty', 'Teacher', 'External Faculty']), paperSetterController.checkIfAssigned);
router.get('/faculty/assignments', checkRole(['Faculty', 'Teacher', 'External Faculty']), paperSetterController.getFacultyAssignments);
router.post('/faculty/upload', checkRole(['Faculty', 'Teacher', 'External Faculty']), upload.single('paperFile'), paperSetterController.uploadPaper);

// Chief Examiner Endpoints (admin/super_admin/HOD)
router.get('/chief/dashboard', checkRole(['admin', 'SUPER_ADMIN', 'college_admin', 'HOD']), paperSetterController.getReviewDashboard);
router.post('/chief/finalize', checkRole(['admin', 'SUPER_ADMIN', 'college_admin', 'HOD']), paperSetterController.finalizePaper);

// Shared Download
router.get('/download/:paper_id', paperSetterController.downloadPaper);

module.exports = router;
