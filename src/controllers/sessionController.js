const db = require('../config/db');

exports.createSession = async (req, res) => {
    const { sport_id, date, start_time, venue, additional_players_required, team1_name, team2_name, team1_players, team2_players } = req.body;

    if (!sport_id || !date || !start_time || !venue || additional_players_required === undefined || !team1_name || !team2_name) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate date in the future
    const sessionDateTime = new Date(`${date}T${start_time}`);
    if (sessionDateTime <= new Date()) {
        return res.status(400).json({ error: 'Cannot create a session in the past.' });
    }

    if (additional_players_required < 0) {
        return res.status(400).json({ error: 'Additional players required must be at least 0.' });
    }

    const t1p = Array.isArray(team1_players) ? team1_players : [];
    const t2p = Array.isArray(team2_players) ? team2_players : [];

    try {
        const sportCheck = await db.query('SELECT id FROM sports WHERE id = $1', [sport_id]);
        if (sportCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Sport not found.' });
        }

        const { rows } = await db.query(
            `INSERT INTO sessions 
      (sport_id, created_by, date, start_time, venue, additional_players_required, status, team1_name, team2_name, team1_players, team2_players) 
      VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $10) 
      RETURNING *`,
            [sport_id, req.user.id, date, start_time, venue, additional_players_required, team1_name, team2_name, JSON.stringify(t1p), JSON.stringify(t2p)]
        );

        res.status(201).json({ message: 'Session created successfully', session: rows[0] });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAvailableSessions = async (req, res) => {
    try {
        const query = `
      SELECT s.*, 
             sp.name as sport_name, 
             u.name as creator_name,
             (SELECT COUNT(*) FROM session_players p WHERE p.session_id = s.id) as joined_count,
             (
                SELECT COALESCE(json_agg(json_build_object('id', ju.id, 'name', ju.name)), '[]')
                FROM session_players jsp
                JOIN users ju ON jsp.user_id = ju.id
                WHERE jsp.session_id = s.id
             ) as joined_players
      FROM sessions s
      JOIN sports sp ON s.sport_id = sp.id
      JOIN users u ON s.created_by = u.id
      WHERE (s.date > CURRENT_DATE OR (s.date = CURRENT_DATE AND s.start_time >= CURRENT_TIME))
      ORDER BY s.date ASC, s.start_time ASC
    `;
        const { rows } = await db.query(query);
        res.status(200).json({ sessions: rows });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCreatedSessions = async (req, res) => {
    try {
        const query = `
      SELECT s.*, sp.name as sport_name,
             (SELECT COUNT(*) FROM session_players p WHERE p.session_id = s.id) as joined_count
      FROM sessions s
      JOIN sports sp ON s.sport_id = sp.id
      WHERE s.created_by = $1
      ORDER BY s.date DESC, s.start_time DESC
    `;
        const { rows } = await db.query(query, [req.user.id]);
        res.status(200).json({ sessions: rows });
    } catch (error) {
        console.error('Error fetching created sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getJoinedSessions = async (req, res) => {
    try {
        const query = `
      SELECT s.*, sp.name as sport_name, u.name as creator_name
      FROM session_players jsp
      JOIN sessions s ON jsp.session_id = s.id
      JOIN sports sp ON s.sport_id = sp.id
      JOIN users u ON s.created_by = u.id
      WHERE jsp.user_id = $1
      ORDER BY s.date DESC, s.start_time DESC
    `;
        const { rows } = await db.query(query, [req.user.id]);
        res.status(200).json({ sessions: rows });
    } catch (error) {
        console.error('Error fetching joined sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.joinSession = async (req, res) => {
    const { id } = req.params;

    try {
        const sessionRes = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        const session = sessionRes.rows[0];

        if (session.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot join a cancelled session.' });
        }

        const timeCheck = await db.query(`
      SELECT 
       (date < CURRENT_DATE OR (date = CURRENT_DATE AND start_time < CURRENT_TIME)) as is_past,
       (SELECT COUNT(*) FROM session_players WHERE session_id = $1) as current_joins
      FROM sessions WHERE id = $1
    `, [id]);

        if (timeCheck.rows[0].is_past) {
            return res.status(400).json({ error: 'Cannot join a past session.' });
        }

        const exists = await db.query('SELECT id FROM session_players WHERE session_id = $1 AND user_id = $2', [id, req.user.id]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'You have already joined this session.' });
        }

        // Check for time conflicts
        const conflictCheck = await db.query(`
            SELECT s.id 
            FROM session_players sp
            JOIN sessions s ON sp.session_id = s.id
            WHERE sp.user_id = $1 
              AND s.date = $2 
              AND s.start_time = $3 
              AND s.status != 'cancelled'
        `, [req.user.id, session.date, session.start_time]);

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({ error: 'You cannot join this session because you already have another session scheduled at this date and time.' });
        }

        if (parseInt(timeCheck.rows[0].current_joins) >= session.additional_players_required) {
            return res.status(400).json({ error: 'Session is full.' });
        }

        if (session.created_by === req.user.id) {
            return res.status(400).json({ error: 'Creator cannot join as an additional player.' });
        }

        await db.query(
            'INSERT INTO session_players (session_id, user_id) VALUES ($1, $2)',
            [id, req.user.id]
        );

        res.status(200).json({ message: 'Successfully joined the session.' });
    } catch (error) {
        console.error('Error joining session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.cancelSession = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ error: 'Cancellation reason is required.' });
    }

    try {
        const sessionRes = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        const session = sessionRes.rows[0];

        if (session.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Only the creator can cancel this session.' });
        }

        if (session.status === 'cancelled') {
            return res.status(400).json({ error: 'Session is already cancelled.' });
        }

        const { rows } = await db.query(
            'UPDATE sessions SET status = $1, cancellation_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            ['cancelled', reason, id]
        );

        res.status(200).json({ message: 'Session cancelled successfully', session: rows[0] });
    } catch (error) {
        console.error('Error cancelling session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
