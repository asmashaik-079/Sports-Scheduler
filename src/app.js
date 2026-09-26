const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');

require('dotenv').config();

const db = require('./config/db');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const sportRoutes = require('./routes/sports');
const reportRoutes = require('./routes/reports');
const sessionRoutes = require('./routes/sessions');
require('./passport/config');

const app = express();

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render deployments
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Session setup
app.use(session({
    store: new pgSession({
        pool: db.pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static('public'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sessions', sessionRoutes);

module.exports = app;
