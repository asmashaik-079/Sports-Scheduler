const fs = require('fs');
let c = fs.readFileSync('public/js/app.js', 'utf8');

const routeStr = `
        if (hash === 'change-password') {
            import('./components/account.js').then(m => m.AccountView.render(container, this));
            return;
        }

        if (['admin', 'reports'].includes(hash)) {`;

c = c.replace("        if (['admin', 'reports'].includes(hash)) {", routeStr);
fs.writeFileSync('public/js/app.js', c);
