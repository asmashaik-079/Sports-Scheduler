const { spawn } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

async function testAdmin() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('adminpass', 10);
    let adminId;
    const adminCheck = await client.query("SELECT id FROM users WHERE email='admin_test@test.com'");
    if (adminCheck.rows.length === 0) {
        const res = await client.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin_test@test.com', $1, 'admin') RETURNING id", [hash]);
        adminId = res.rows[0].id;
    } else {
        adminId = adminCheck.rows[0].id;
    }
    await client.end();

    console.log('Starting server...');
    const serverPro = spawn('node', ['server.js'], { cwd: process.cwd() });
    await new Promise(resolve => setTimeout(resolve, 2000));

    let passed = true;
    let adminCookie = '';
    let playerCookie = '';
    let testSportId;

    try {
        const adminLogin = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin_test@test.com', password: 'adminpass' })
        });
        adminCookie = adminLogin.headers.get('set-cookie');

        const pEmail = `player_${Date.now()}@test.com`;
        const playerReg = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Player', email: pEmail, password: 'playerpass' })
        });
        playerCookie = playerReg.headers.get('set-cookie');

        console.log('Test 1: Player create sport (Expected: 403)');
        const pCreate = await fetch('http://localhost:3000/api/sports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': playerCookie },
            body: JSON.stringify({ name: 'Football', description: 'desc' })
        });
        console.log('Player create sport Status:', pCreate.status);
        if (pCreate.status !== 403) passed = false;

        console.log('Test 2: Admin creates sport (Expected: 201)');
        const aCreate = await fetch('http://localhost:3000/api/sports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
            body: JSON.stringify({ name: `Sport_${Date.now()}`, description: 'Admin created sport' })
        });
        console.log('Admin create sport Status:', aCreate.status);
        if (aCreate.status !== 201) passed = false;
        const sData = await aCreate.json();
        testSportId = sData.sport.id;

        console.log('Test 3: Admin gets sports (Expected: 200)');
        const aGet = await fetch('http://localhost:3000/api/sports', {
            headers: { 'Cookie': adminCookie }
        });
        console.log('Admin get sports Status:', aGet.status);
        if (aGet.status !== 200) passed = false;

        console.log('Test 4: Admin updates sport (Expected: 200)');
        const aUpdate = await fetch(`http://localhost:3000/api/sports/${testSportId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
            body: JSON.stringify({ name: `Sport_Updated_${Date.now()}`, description: 'Updated' })
        });
        console.log('Admin update sport Status:', aUpdate.status);
        if (aUpdate.status !== 200) passed = false;

        console.log('Test 5: Admin fetches report (Expected: 200)');
        const aReport = await fetch('http://localhost:3000/api/reports/sessions?startDate=2020-01-01&endDate=2030-01-01', {
            headers: { 'Cookie': adminCookie }
        });
        console.log('Admin report Status:', aReport.status);
        if (aReport.status !== 200) passed = false;

        console.log('Test 6: Admin deletes sport (Expected: 200)');
        const aDel = await fetch(`http://localhost:3000/api/sports/${testSportId}`, {
            method: 'DELETE',
            headers: { 'Cookie': adminCookie }
        });
        console.log('Admin delete sport Status:', aDel.status);
        if (aDel.status !== 200) passed = false;

    } catch (err) {
        console.error('Test error:', err);
        passed = false;
    } finally {
        serverPro.kill();
        console.log('Server killed');
        console.log(passed ? 'ALL ADMIN TESTS PASSED' : 'SOME ADMIN TESTS FAILED');
    }
}

testAdmin();
