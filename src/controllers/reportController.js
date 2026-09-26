const db = require('../config/db');

const isValidDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateStr.match(regex)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

exports.getSessionsReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate parameters are strictly required.' });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return res.status(400).json({ error: 'Dates deeply invalid. Must conform to YYYY-MM-DD bounds.' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate > eDate) {
        return res.status(400).json({ error: 'Chronological error: startDate cannot evaluate after endDate.' });
    }

    try {
        const playedCondition = `
      status != 'cancelled' 
      AND (date < CURRENT_DATE OR (date = CURRENT_DATE AND start_time < CURRENT_TIME))
      AND date >= $1 AND date <= $2
    `;

        const totalQuery = `SELECT COUNT(*) as total_played FROM sessions WHERE ${playedCondition}`;
        const totalRes = await db.query(totalQuery, [startDate, endDate]);
        const totalPlayed = parseInt(totalRes.rows[0].total_played, 10);

        const popularityQuery = `
      SELECT sp.name, COUNT(se.id) as session_count
      FROM sports sp
      INNER JOIN sessions se ON sp.id = se.sport_id
      WHERE se.status != 'cancelled' 
        AND (se.date < CURRENT_DATE OR (se.date = CURRENT_DATE AND se.start_time < CURRENT_TIME))
        AND se.date >= $1 AND se.date <= $2
      GROUP BY sp.id, sp.name
      ORDER BY session_count DESC
    `;

        const popRes = await db.query(popularityQuery, [startDate, endDate]);

        let popularity = popRes.rows.map(row => {
            const count = parseInt(row.session_count, 10);
            const percentage = totalPlayed > 0 ? ((count / totalPlayed) * 100).toFixed(2) : '0.00';
            return {
                sport: row.name,
                session_count: count,
                percentage: `${percentage}%`
            };
        });

        res.status(200).json({
            period: {
                startDate,
                endDate
            },
            total_played: totalPlayed,
            popularity
        });

    } catch (error) {
        console.error('Error fetching admin report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
