const { spawn } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

async function testPlayer() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('pass', 10);

    await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('A1', 'a1@test.com', $1, 'admin') ON CONFLICT DO NOTHING", [hash]);
    await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('P1', 'p1@test.com', $1, 'player') ON CONFLICT DO NOTHING", [hash]);
    await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('P2', 'p2@test.com', $1, 'player') ON CONFLICT DO NOTHING", [hash]);

    const sportRes = await client.query("INSERT INTO sports (name, description) VALUES ('TSport', 'Desc') ON CONFLICT DO NOTHING RETURNING id");
    let sportId;
    if (sportRes.rows.length > 0) sportId = sportRes.rows[0].id;
    else {
        const s = await client.query("SELECT id FROM sports LIMIT 1");
        sportId = s.rows[0].id;
    }
    await client.end();

    console.log('Starting server...');
    const serverPro = spawn('node', ['server.js'], { cwd: process.cwd() });
    await new Promise(resolve => setTimeout(resolve, 2000));

    let passed = true;
    let p1Cookie, p2Cookie, a1Cookie;
    let sessionId;

    async function login(email) {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'pass' })
        });
        return res.headers.get('set-cookie');
    }

    try {
        p1Cookie = await login('p1@test.com');
        p2Cookie = await login('p2@test.com');
        a1Cookie = await login('a1@test.com');

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const dStr = futureDate.toISOString().split('T')[0];

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pdStr = pastDate.toISOString().split('T')[0];

        const sCreate = await fetch('http://localhost:3000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': p1Cookie },
            body: JSON.stringify({ sport_id: sportId, date: dStr, start_time: '14:00', venue: 'V1', additional_players_required: 1, team1_name: 'T1', team2_name: 'T2' })
        });
        if (sCreate.status !== 201) { console.log('Fail: P1 create session', sCreate.status); passed = false; }
        const sData = await sCreate.json();
        sessionId = sData.session.id;

        const aCreate = await fetch('http://localhost:3000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': a1Cookie },
            body: JSON.stringify({ sport_id: sportId, date: dStr, start_time: '15:00', venue: 'V2', additional_players_required: 2, team1_name: 'T1', team2_name: 'T2' })
        });
        if (aCreate.status !== 201) { console.log('Fail: Admin create session'); passed = false; }

        const pastCreate = await fetch('http://localhost:3000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': p1Cookie },
            body: JSON.stringify({ sport_id: sportId, date: pdStr, start_time: '10:00', venue: 'V1', additional_players_required: 1, team1_name: 'T1', team2_name: 'T2' })
        });
        if (pastCreate.status !== 400) { console.log('Fail: Past create not rejected', pastCreate.status); passed = false; }

        const viewAv = await fetch('http://localhost:3000/api/sessions', { headers: { 'Cookie': p2Cookie } });
        if (viewAv.status !== 200) { console.log('Fail: View sessions'); passed = false; }

        const joinRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/join`, {
            method: 'POST',
            headers: { 'Cookie': p2Cookie }
        });
        if (joinRes.status !== 200) { console.log('Fail: Join session', joinRes.status); passed = false; }

        const dupJoinRes = await fetch(`http://localhost:3000/api/sessions/${sessionId}/join`, {
            method: 'POST',
            headers: { 'Cookie': p2Cookie }
        });
        if (dupJoinRes.status !== 409) { console.log('Fail: Dup join not rejected', dupJoinRes.status); passed = false; }

        const a1Join = await fetch(`http://localhost:3000/api/sessions/${sessionId}/join`, {
            method: 'POST',
            headers: { 'Cookie': a1Cookie }
        });
        if (a1Join.status !== 400) { console.log('Fail: Full session join not rejected', a1Join.status); passed = false; }

        const viewAv2 = await fetch('http://localhost:3000/api/sessions', { headers: { 'Cookie': p1Cookie } });
        const vd2 = await viewAv2.json();
        const targeted = vd2.sessions.find(s => s.id === sessionId);
        if (!targeted.joined_players || !targeted.joined_players.find(jp => jp.name === 'P2')) {
            console.log('Fail: P2 not in joined_players list'); passed = false;
        }

        const badCancel = await fetch(`http://localhost:3000/api/sessions/${sessionId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': p2Cookie },
            body: JSON.stringify({ reason: 'Test' })
        });
        if (badCancel.status !== 403) { console.log('Fail: Bad cancel not 403'); passed = false; }

        const goodCancel = await fetch(`http://localhost:3000/api/sessions/${sessionId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': p1Cookie },
            body: JSON.stringify({ reason: 'Rain' })
        });
        if (goodCancel.status !== 200) { console.log('Fail: Good cancel', goodCancel.status); passed = false; }

        const a1Join2 = await fetch(`http://localhost:3000/api/sessions/${sessionId}/join`, {
            method: 'POST',
            headers: { 'Cookie': a1Cookie }
        });
        if (a1Join2.status !== 400) { console.log('Fail: Cancelled session joinable'); passed = false; }

    } catch (err) {
        console.error('Test error:', err);
        passed = false;
    } finally {
        serverPro.kill();
        console.log('Server killed');
        console.log(passed ? 'ALL PLAYER TESTS PASSED' : 'SOME PLAYER TESTS FAILED');
    }
}
testPlayer();
