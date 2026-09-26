const { spawn } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

async function testReport() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('pass', 10);

    await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('AdminR', 'a_report@test.com', $1, 'admin') ON CONFLICT DO NOTHING", [hash]);
    await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('PlayerR', 'p_report@test.com', $1, 'player') ON CONFLICT DO NOTHING", [hash]);

    // Clean up sessions for clarity
    await client.query("DELETE FROM session_players");
    await client.query("DELETE FROM sessions");
    await client.query("DELETE FROM sports");

    const creatorRes = await client.query("SELECT id FROM users LIMIT 1");
    const cid = creatorRes.rows[0].id;

    const sp1 = await client.query("INSERT INTO sports (name, description) VALUES ('Basketball', 'desc') RETURNING id");
    const s1_id = sp1.rows[0].id;

    const sp2 = await client.query("INSERT INTO sports (name, description) VALUES ('Tennis', 'desc') RETURNING id");
    const s2_id = sp2.rows[0].id;

    // Insert mock sessions directly
    const futureD = new Date();
    futureD.setDate(futureD.getDate() + 10);
    const fdStr = futureD.toISOString().split('T')[0];

    const pastD1 = new Date();
    pastD1.setDate(pastD1.getDate() - 10);
    const pd1Str = pastD1.toISOString().split('T')[0];

    const pastD2 = new Date();
    pastD2.setDate(pastD2.getDate() - 5);
    const pd2Str = pastD2.toISOString().split('T')[0];

    // 1 played correctly (S1)
    await client.query("INSERT INTO sessions (sport_id, created_by, date, start_time, venue, status) VALUES ($1, $2, $3, '10:00', 'V0', 'open')", [s1_id, cid, pd1Str]);
    // 1 played correctly (S2)
    await client.query("INSERT INTO sessions (sport_id, created_by, date, start_time, venue, status) VALUES ($1, $2, $3, '12:00', 'V1', 'open')", [s2_id, cid, pd2Str]);
    // 1 played correctly (S2 again)
    await client.query("INSERT INTO sessions (sport_id, created_by, date, start_time, venue, status) VALUES ($1, $2, $3, '14:00', 'V2', 'open')", [s2_id, cid, pd2Str]);

    // 1 cancelled past (S1)
    await client.query("INSERT INTO sessions (sport_id, created_by, date, start_time, venue, status) VALUES ($1, $2, $3, '15:00', 'V3', 'cancelled')", [s1_id, cid, pd1Str]);
    // 1 future (S1)
    await client.query("INSERT INTO sessions (sport_id, created_by, date, start_time, venue, status) VALUES ($1, $2, $3, '09:00', 'V4', 'open')", [s1_id, cid, fdStr]);

    await client.end();

    console.log('Starting server...');
    const serverPro = spawn('node', ['server.js'], { cwd: process.cwd() });
    await new Promise(resolve => setTimeout(resolve, 2000));

    let passed = true;

    async function login(email) {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'pass' })
        });
        return res.headers.get('set-cookie') || '';
    }

    try {
        const adminCookie = await login('a_report@test.com');
        const playerCookie = await login('p_report@test.com');

        // Expected: 200. totalPlayed: 3. Tennis: 2 (66.67%), Basketball: 1 (33.33%)
        const aRep = await fetch('http://localhost:3000/api/reports/sessions?startDate=2000-01-01&endDate=2030-01-01', {
            headers: { 'Cookie': adminCookie }
        });
        console.log('Admin valid report:', aRep.status);
        if (aRep.status !== 200) passed = false;
        else {
            const data = await aRep.json();
            console.log('Report Data:', data);
            if (data.total_played !== 3) {
                console.log('Fail: total played mismatch', data.total_played);
                passed = false;
            }
            const tennis = data.popularity.find(p => p.sport === 'Tennis');
            if (!tennis || tennis.session_count !== 2) {
                console.log('Fail: Tennis count incorrect');
                passed = false;
            }
        }

        // Unauthenticated
        const noAuth = await fetch('http://localhost:3000/api/reports/sessions?startDate=2000-01-01&endDate=2030-01-01');
        if (noAuth.status !== 401) { console.log('Fail: Unauth 401'); passed = false; }

        // Non-admin (403)
        const pRep = await fetch('http://localhost:3000/api/reports/sessions?startDate=2000-01-01&endDate=2030-01-01', {
            headers: { 'Cookie': playerCookie }
        });
        if (pRep.status !== 403) { console.log('Fail: Non-admin 403'); passed = false; }

        // Missing Range
        const mRep = await fetch('http://localhost:3000/api/reports/sessions', {
            headers: { 'Cookie': adminCookie }
        });
        if (mRep.status !== 400) { console.log('Fail: Missing 400'); passed = false; }

        // Invalid Date Format
        const iRep = await fetch('http://localhost:3000/api/reports/sessions?startDate=invalid&endDate=2030-01-01', {
            headers: { 'Cookie': adminCookie }
        });
        if (iRep.status !== 400) { console.log('Fail: Invalid 400'); passed = false; }

        // Start > End
        const sRep = await fetch('http://localhost:3000/api/reports/sessions?startDate=2030-01-01&endDate=2020-01-01', {
            headers: { 'Cookie': adminCookie }
        });
        if (sRep.status !== 400) { console.log('Fail: Start > End 400'); passed = false; }

    } catch (err) {
        console.error('Test error:', err);
        passed = false;
    } finally {
        serverPro.kill();
        console.log('Server killed');
        console.log(passed ? 'ALL REPORT TESTS PASSED' : 'SOME REPORT TESTS FAILED');
    }
}
testReport();
