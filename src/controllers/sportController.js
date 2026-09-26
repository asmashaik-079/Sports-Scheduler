const db = require('../config/db');

exports.getAllSports = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM sports ORDER BY name ASC');
        res.status(200).json({ sports: rows });
    } catch (error) {
        console.error('Error fetching sports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createSport = async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Sport name is required.' });
    }

    try {
        const exist = await db.query('SELECT id FROM sports WHERE name = $1', [name]);
        if (exist.rows.length > 0) {
            return res.status(409).json({ error: 'Sport with this name already exists.' });
        }

        const { rows } = await db.query(
            'INSERT INTO sports (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json({ message: 'Sport created successfully', sport: rows[0] });
    } catch (error) {
        console.error('Error creating sport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateSport = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Sport name is required.' });
    }

    try {
        const existing = await db.query('SELECT id FROM sports WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Sport not found.' });
        }

        const nameExist = await db.query('SELECT id FROM sports WHERE name = $1 AND id != $2', [name, id]);
        if (nameExist.rows.length > 0) {
            return res.status(409).json({ error: 'Another sport with this name already exists.' });
        }

        const { rows } = await db.query(
            'UPDATE sports SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        res.status(200).json({ message: 'Sport updated successfully', sport: rows[0] });
    } catch (error) {
        console.error('Error updating sport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteSport = async (req, res) => {
    const { id } = req.params;

    try {
        const sessions = await db.query('SELECT id FROM sessions WHERE sport_id = $1 LIMIT 1', [id]);
        if (sessions.rows.length > 0) {
            return res.status(400).json({ error: 'Cannot delete sport as it has associated sessions.' });
        }

        const { rowCount } = await db.query('DELETE FROM sports WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Sport not found.' });
        }

        res.status(200).json({ message: 'Sport deleted successfully' });
    } catch (error) {
        console.error('Error deleting sport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
