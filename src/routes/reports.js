const express = require('express');
const { getSessionsReport } = require('../controllers/reportController');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/sessions', isLoggedIn, isAdmin, getSessionsReport);

module.exports = router;
