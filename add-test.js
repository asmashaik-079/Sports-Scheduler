const fs = require('fs');
let c = fs.readFileSync('test_auth.js', 'utf8');

const testCode = `
        const meRes = await fetch('http://localhost:3000/api/auth/me', { headers: { 'Cookie': loginCookie } });
        console.log('ME Code:', meRes.status, 'Body:', await meRes.json());

        // Test Change Password
        console.log('Testing Change Password...');
        const cpRes = await fetch('http://localhost:3000/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Cookie': loginCookie },
            body: JSON.stringify({ currentPassword: 'pass', newPassword: 'newpassword123' })
        });
        console.log('Change Password Code:', cpRes.status);
        if (cpRes.status !== 200) {
            console.log('Body:', await cpRes.json());
            throw new Error('Change password failed');
        }

        // Test login with new password
        const loginNewRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailStr, password: 'newpassword123' })
        });
        if (loginNewRes.status !== 200) throw new Error('Login with new password failed');
        
        // Test login with old password
        const loginOldRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailStr, password: 'pass' })
        });
        if (loginOldRes.status !== 401) throw new Error('Login with old password succeeded');
`;

c = c.replace(
    "const meRes = await fetch('http://localhost:3000/api/auth/me', { headers: { 'Cookie': loginCookie } });\n        console.log('ME Code:', meRes.status, 'Body:', await meRes.json());",
    testCode
);

fs.writeFileSync('test_auth.js', c);
