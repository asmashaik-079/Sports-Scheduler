const express = require('express');
const passport = require('passport');
const { register, login, logout, me, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });
        req.login(user, (err) => {
            if (err) return next(err);
            return login(req, res);
        });
    })(req, res, next);
});

router.post('/logout', isLoggedIn, logout);
router.get('/me', isLoggedIn, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.put('/change-password', isLoggedIn, changePassword);

module.exports = router;
