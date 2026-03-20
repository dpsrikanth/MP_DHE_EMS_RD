const express = require('express');
const router = express.Router();
const gradingController = require('../controllers/gradingController');
const { verifyToken } = require('../middleware/auth.middleware');

// Public/Student access to GET (if needed) - can be restricted to verifyToken
router.get('/config', verifyToken, gradingController.getGradingConfig);

// Admin only access to POST
router.post('/config', verifyToken, gradingController.updateGradingConfig);

// Fetch all subjects for config
router.get('/subjects', verifyToken, gradingController.getSubjectsForConfig);

module.exports = router;
