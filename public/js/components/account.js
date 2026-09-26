import { api } from '../api.js';
import { UI } from '../ui.js';

export const AccountView = {
    render(container, app) {
        container.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 0 auto; margin-top: 2rem;">
                <h3 class="mb-4">Change Password</h3>
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" id="cpCurrent" required placeholder="Enter current password">
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="cpNew" required placeholder="Minimum 8 characters">
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" id="cpConfirm" required placeholder="Confirm new password">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Change Password</button>
                </form>
            </div>
        `;

        document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const current = document.getElementById('cpCurrent').value;
            const newPass = document.getElementById('cpNew').value;
            const confirmPass = document.getElementById('cpConfirm').value;

            if (newPass !== confirmPass) {
                UI.showToast('New passwords do not match', 'error');
                return;
            }

            try {
                const res = await api.auth.changePassword(current, newPass);
                UI.showToast(res.message || 'Password changed successfully');
                document.getElementById('changePasswordForm').reset();
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        });
    }
};
