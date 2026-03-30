const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Examination Hall Infrastructure
 *   description: Management of physical examination halls for college admins
 */

// Route to get all halls
router.get('/', hallController.getHalls);

// Route to create a new hall
router.post('/', hallController.createHall);

// Route to submit a hall for approval
router.put('/:id/submit', hallController.submitHall);

// Route to update a hall
router.put('/:id', hallController.updateHall);

// Route to delete a hall
router.delete('/:id', hallController.deleteHall);

// Route to get all halls pending review (For University Admin)
router.get('/pending', hallController.getAllHallsForApproval);

// Route for University Admin to Approve/Reject
router.put('/:id/approve-reject', hallController.approveRejectHall);

// Route to send shortage request
router.post('/shortage-request', hallController.createShortageRequest);

// Route for University Admin to view shortage requests
router.get('/shortage-requests', hallController.getAllShortageRequests);

module.exports = router;
