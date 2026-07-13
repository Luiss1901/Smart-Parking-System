const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/revenue', reportController.getRevenue);
router.get('/usage', reportController.getUsage);

module.exports = router;
