const express = require('express');
const router = express.Router();
const generateController = require('../controllers/generate');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

router.post('/', authMiddleware, rateLimit, generateController.generate);

module.exports = router;
