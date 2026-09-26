const { Client } = require('pg');
require('dotenv').config();

async function seedSports() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const sports = [
        'Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis', 'Volleyball',
        'Kabaddi', 'Hockey', 'Table Tennis', 'Baseball', 'Handball', 'Athletics'
    ];

    for (const name of sports) {
        const res = await client.query('SELECT id FROM sports WHERE name = $1', [name]);
        if (res.rows.length === 0) {
            await client.query('INSERT INTO sports (name, description) VALUES ($1, $2)', [name, 'Default sport provided by system']);
            console.log(`Inserted: ${name}`);
        } else {
            console.log(`Already exists: ${name}`);
        }
    }

    await client.end();
    console.log('Seed complete.');
}

seedSports().catch(console.error);
