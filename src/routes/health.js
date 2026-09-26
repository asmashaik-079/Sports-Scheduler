const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/health', async (req, res) => {
    try {
        // Check if database is connected
        const result = await db.query('SELECT NOW()');
        res.status(200).json({
            status: 'UP',
            time: new Date().toISOString(),
            database: 'connected',
            dbTime: result.rows[0].now
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({
            status: 'DOWN',
            time: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

module.exports = router;
