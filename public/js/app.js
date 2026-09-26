import { AuthView } from './components/auth.js';
import { PlayerDashboard } from './components/player.js';
import { AdminDashboard } from './components/admin.js';
import { api } from './api.js';

const App = {
    user: null,
    root: document.getElementById('app'),

    async init() {
        if (!this.root) return;
        try {
            const data = await api.auth.me();
            this.user = data.user;
        } catch (e) {
            this.user = null; // Unauthenticated
        }
        this.render();
    },

    render() {
        const fullHash = window.location.hash.substring(1) || 'dashboard';
        let hash = fullHash.split('?')[0];

        if (!this.user && !['login', 'register', 'forgot-password', 'reset-password'].includes(hash)) {
            // Force auth hash
            window.location.hash = 'login';
            return;
        }

        this.root.innerHTML = '';
        this.root.appendChild(this.buildNav());

        const container = document.createElement('main');
        container.className = 'container';
        container.style.marginTop = '2rem';
        this.root.appendChild(container);

        if (!this.user) {
            AuthView.render(container, this);
            return;
        }

        // Restrict non-admins from admin pages
        if (this.user.role !== 'admin' && ['admin', 'reports'].includes(hash)) {
            hash = 'dashboard';
            window.location.hash = hash;
        }

        // Prevent logged-in users from seeing auth screens natively
        if (['login', 'register', 'forgot-password', 'reset-password'].includes(hash)) {
            hash = this.user.role === 'admin' ? 'admin' : 'dashboard';
            window.location.hash = hash;
        }


        if (hash === 'change-password') {
            import('./components/account.js').then(m => m.AccountView.render(container, this));
            return;
        }

        if (['admin', 'reports'].includes(hash)) {
            AdminDashboard.render(container, this);
        } else {
            PlayerDashboard.render(container, this);
        }
    },

    buildNav() {
        const nav = document.createElement('nav');
        const content = document.createElement('div');
        content.className = 'nav-content';

        const logoTarget = this.user ? (this.user.role === 'admin' ? '#admin' : '#dashboard') : '#login';

        const brand = document.createElement('a');
        brand.className = 'logo';
        brand.href = logoTarget;
        brand.innerHTML = `<span>⚡</span> Sports Scheduler`;

        const links = document.createElement('div');
        links.className = 'nav-links';

        const hash = window.location.hash.substring(1);

        if (this.user) {
            const linkAdmin = this.user.role === 'admin' ? `<a href="#admin" style="font-weight:600; color:var(--primary);">Admin Portal</a>` : '';
            links.innerHTML = `
                ${linkAdmin}
                <a href="#dashboard">Play Sports</a>
                <span style="border-right: 1px solid var(--border); padding-right: 1.5rem; margin-right: 0.5rem;" class="text-muted flex items-center gap-4">
                   <span class="badge ${this.user.role === 'admin' ? 'badge-cancelled' : 'badge-open'}" style="margin-left: 0.5rem;">${this.user.role.toUpperCase()}</span> 
                   ${this.user.name}
                </span>
                <a href="#change-password" class="btn btn-secondary btn-sm" style="margin-right: 0.5rem;">Change Password</a>
                <button id="logoutBtn" class="btn btn-secondary btn-sm">Logout</button>
            `;
        } else {
            if (hash === 'register') {
                links.innerHTML = `<a href="#login" class="btn btn-primary btn-sm">Sign In Instead</a>`;
            } else {
                links.innerHTML = `<a href="#register" class="btn btn-primary btn-sm">Sign Up Now</a>`;
            }
        }

        content.appendChild(brand);
        content.appendChild(links);
        nav.appendChild(content);

        // Bind logout safely
        setTimeout(() => {
            const lBtn = document.getElementById('logoutBtn');
            if (lBtn) {
                lBtn.addEventListener('click', async () => {
                    await api.auth.logout();
                    this.user = null;
                    window.location.hash = 'login';
                    this.render();
                });
            }
        }, 0);

        return nav;
    },

    navigate(hash) {
        window.location.hash = hash;
    }
}

window.addEventListener('hashchange', () => App.render());
document.addEventListener('DOMContentLoaded', () => App.init());
