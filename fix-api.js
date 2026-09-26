const fs = require('fs');

let c = fs.readFileSync('public/js/api.js', 'utf8');
c = c.replace(
    'resetPassword: (token, newPassword) => fetchAPI(\'/auth/reset-password\', { method: \'POST\', body: JSON.stringify({ token, newPassword }) })',
    'resetPassword: (token, newPassword) => fetchAPI(\'/auth/reset-password\', { method: \'POST\', body: JSON.stringify({ token, newPassword }) }),\n        changePassword: (currentPassword, newPassword) => fetchAPI(\'/auth/change-password\', { method: \'PUT\', body: JSON.stringify({ currentPassword, newPassword }) })'
);
fs.writeFileSync('public/js/api.js', c);

let appC = fs.readFileSync('public/js/app.js', 'utf8');
appC = appC.replace('<button id="logoutBtn"', '<a href="#change-password" class="btn btn-secondary btn-sm" style="margin-right: 0.5rem;">Change Password</a>\n                <button id="logoutBtn"');
fs.writeFileSync('public/js/app.js', appC);
