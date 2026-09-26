const express = require('express');
const {
    createSession,
    getAvailableSessions,
    getCreatedSessions,
    getJoinedSessions,
    joinSession,
    cancelSession
} = require('../controllers/sessionController');
const { isLoggedIn } = require('../middleware/auth');
const router = express.Router();

router.post('/', isLoggedIn, createSession);
router.get('/', isLoggedIn, getAvailableSessions);
router.get('/created', isLoggedIn, getCreatedSessions);
router.get('/joined', isLoggedIn, getJoinedSessions);
router.post('/:id/join', isLoggedIn, joinSession);
router.post('/:id/cancel', isLoggedIn, cancelSession);

module.exports = router;
