import { api } from '../api.js';
import { UI } from '../ui.js';

export const AuthView = {
    render(container, app) {
        const fullHash = window.location.hash.substring(1);
        const hash = fullHash.split('?')[0];

        if (hash === 'forgot-password') {
            container.innerHTML = `
                <div class="auth-wrapper">
                    <div class="auth-card">
                        <div class="text-center mb-8">
                            <h2>Reset your password</h2>
                            <p class="text-muted mt-4">Enter your email and we'll send you a reset link.</p>
                        </div>
                        <form id="forgotForm">
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" id="forgotEmail" required placeholder="name@example.com">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                                Send Reset Link
                            </button>
                        </form>
                        <div class="text-center mt-4">
                            <a href="#login" class="nav-links">Back to Sign In</a>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('forgotForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail').value;
                try {
                    const res = await api.auth.forgotPassword(email);
                    UI.showToast(res.message);
                } catch (err) {
                    UI.showToast(err.message, 'error');
                }
            });
            return;
        }

        if (hash === 'reset-password') {
            const token = new URLSearchParams(fullHash.split('?')[1]).get('token');
            container.innerHTML = `
                <div class="auth-wrapper">
                    <div class="auth-card">
                        <div class="text-center mb-8">
                            <h2>Reset Password</h2>
                            <p class="text-muted mt-4">Enter your new password below.</p>
                        </div>
                        <form id="resetForm">
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" id="resetPassword" required placeholder="********">
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" id="resetPasswordConfirm" required placeholder="********">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            `;
            document.getElementById('resetForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = document.getElementById('resetPassword').value;
                const confirmPassword = document.getElementById('resetPasswordConfirm').value;
                if (newPassword !== confirmPassword) {
                    UI.showToast('Passwords do not match', 'error');
                    return;
                }
                try {
                    const res = await api.auth.resetPassword(token, newPassword);
                    UI.showToast(res.message);
                    window.location.hash = 'login';
                } catch (err) {
                    UI.showToast(err.message, 'error');
                }
            });
            return;
        }

        const isLogin = hash !== 'register';

        container.innerHTML = `
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div class="text-center mb-8">
                        <h2>${isLogin ? 'Universal Sign In' : 'Create Player Account'}</h2>
                        <p class="text-muted mt-4">${isLogin ? 'Sign in using your Player or Admin credentials.' : 'Join the community and start scheduling sports.'}</p>
                    </div>
                    <form id="authForm">
                        ${!isLogin ? `
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="authName" required placeholder="John Doe">
                        </div>` : ''}
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="authEmail" required placeholder="name@example.com">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="authPassword" required placeholder="********">
                            ${isLogin ? `<div style="text-align: right; margin-top: 0.5rem;"><a href="#forgot-password" class="nav-links" style="font-size: 0.85rem;">Forgot Password?</a></div>` : ''}
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                            ${isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>
                    <div class="text-center mt-4">
                        <p class="text-muted">
                            ${isLogin ?
                `Don't have an account? <a href="#register" class="nav-links">Sign Up</a>` :
                `Already have an account? <a href="#login" class="nav-links">Sign In</a>`
            }
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            try {
                if (isLogin) {
                    const res = await api.auth.login(email, password);
                    UI.showToast('Logged in successfully!');
                    window.location.hash = (res.user && res.user.role === 'admin') ? 'admin' : 'dashboard';
                } else {
                    const name = document.getElementById('authName').value;
                    await api.auth.register(name, email, password);
                    UI.showToast('Account created successfully!');
                    window.location.hash = 'dashboard';
                }
                // Refresh app state
                await app.init();
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        });
    }
};
