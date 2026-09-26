// test_auth.js
const { spawn } = require('child_process');

async function testAuth() {
    console.log('Starting server...');
    const serverPro = spawn('node', ['server.js'], { cwd: process.cwd() });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Testing authentication...');

    let passed = true;
    let testEmail = `test${Date.now()}@test.com`;
    let cookieStr = '';

    try {
        // 1. Health check
        const health = await fetch('http://localhost:3000/api/health').then(res => res.json());
        console.log('Health:', health);

        // 2. Register
        const regRes = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Player', email: testEmail, password: 'password123' })
        });
        const regCookie = regRes.headers.get('set-cookie');
        if (regCookie) cookieStr = regCookie;
        console.log('Register Code:', regRes.status, 'Body:', await regRes.json());
        if (regRes.status !== 201) passed = false;

        // 3. Register Duplicate
        const dupRes = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Player 2', email: testEmail, password: 'password123' })
        });
        console.log('Register Duplicate Code:', dupRes.status);
        if (dupRes.status !== 409) passed = false;

        // 4. Logout
        const logoutRes = await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: { 'Cookie': cookieStr }
        });
        console.log('Logout Code:', logoutRes.status);
        if (logoutRes.status !== 200) passed = false;

        // 5. Login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: 'password123' })
        });
        const loginCookie = loginRes.headers.get('set-cookie');
        if (loginCookie) cookieStr = loginCookie;
        console.log('Login Code:', loginRes.status, 'Body:', await loginRes.json());
        if (loginRes.status !== 200) passed = false;

        // 6. Get ME
        const meRes = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: { 'Cookie': cookieStr }
        });
        console.log('ME Code:', meRes.status, 'Body:', await meRes.json());
        if (meRes.status !== 200) passed = false;

    } catch (err) {
        console.error('Test error:', err);
        passed = false;
    } finally {
        serverPro.kill();
        console.log('Server killed.');
        if (passed) {
            console.log('ALL TESTS PASSED');
        } else {
            console.log('SOME TESTS FAILED');
        }
    }
}

testAuth();
