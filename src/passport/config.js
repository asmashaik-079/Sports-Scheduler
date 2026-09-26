const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../config/db');

passport.use(
    new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
                if (rows.length === 0) {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }

                const user = rows[0];
                const match = await bcrypt.compare(password, user.password_hash);

                if (!match) {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
        if (rows.length === 0) {
            return done(new Error('User not found'));
        }
        done(null, rows[0]);
    } catch (err) {
        done(err);
    }
});
