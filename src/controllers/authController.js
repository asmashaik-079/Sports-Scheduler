const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    try {
        // Check if user already exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email is already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, passwordHash, 'player']
        );

        // Auto-login after registration
        req.login(newUser.rows[0], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Registration successful, but auto-login failed.' });
            }
            return res.status(201).json({
                message: 'Registration successful',
                user: newUser.rows[0]
            });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = (req, res) => {
    res.status(200).json({
        message: 'Login successful',
        user: req.user
    });
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to destroy session' });
            }
            res.clearCookie('connect.sid'); // default session cookie name
            return res.status(200).json({ message: 'Logout successful' });
        });
    });
};

exports.me = (req, res) => {
    res.status(200).json({ user: req.user });
};

const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            // Do not reveal email existence
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const user = userCheck.rows[0];
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

        await db.query(
            'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
            [user.id, tokenHash, expiresAt]
        );

        const resetLink = `http://localhost:3000/#reset-password?token=${rawToken}`;
        
        // Log to console for development
        console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);

        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const tokenRes = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
            [tokenHash]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const resetRecord = tokenRes.rows[0];
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetRecord.user_id]);
            await client.query('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [resetRecord.id]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.status(200).json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.changePassword = async (req, res) => { const { currentPassword, newPassword } = req.body; if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' }); if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' }); if (currentPassword === newPassword) return res.status(400).json({ error: 'New password must be different from current password' }); try { const userRes = await db.query('SELECT password_hash FROM users WHERE id = ', [req.user.id]); if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' }); const user = userRes.rows[0]; const match = await bcrypt.compare(currentPassword, user.password_hash); if (!match) return res.status(400).json({ error: 'Incorrect current password' }); const salt = await bcrypt.genSalt(10); const passwordHash = await bcrypt.hash(newPassword, salt); await db.query('UPDATE users SET password_hash =  WHERE id = ', [passwordHash, req.user.id]); res.status(200).json({ message: 'Password changed successfully' }); } catch (error) { console.error('Change password error:', error); res.status(500).json({ error: 'Internal server error' }); } };
