const express = require('express');
const router = express.Router();
const { getUserData ,register} = require('../controllers/controller');

router.get('/getuser', getUserData);

router.post('/register', register);

module.exports = router;