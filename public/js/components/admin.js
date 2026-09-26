import { api } from '../api.js';
import { UI } from '../ui.js';

export const AdminDashboard = {
    async render(container, app) {
        const hash = window.location.hash.substring(1);
        const currentTab = ['admin', 'reports'].includes(hash) ? hash : 'admin';

        container.innerHTML = `
            <div class="dash-header">
                <div>
                    <h2>Admin Portal 🛡️</h2>
                    <p class="text-muted">Manage sports and view analytic reports.</p>
                </div>
            </div>
            
            <div class="tabs">
                <a href="#admin" class="tab ${currentTab === 'admin' ? 'active' : ''}">Sports Management</a>
                <a href="#reports" class="tab ${currentTab === 'reports' ? 'active' : ''}">Session Reports</a>
            </div>
            
            <div id="admin-content"></div>
        `;

        const content = document.getElementById('admin-content');

        try {
            if (currentTab === 'admin') {
                const data = await api.sports.getAll();
                this.renderSports(content, data.sports, app);
            } else if (currentTab === 'reports') {
                this.renderReports(content);
            }
        } catch (err) {
            content.innerHTML = `<div class="card text-center text-muted">Failed to load admin payload: ${err.message}</div>`;
        }
    },

    renderSports(container, sports, app) {
        container.innerHTML = `
            <div class="grid grid-cols-3">
                <div class="card">
                    <h3 class="mb-4">Create New Sport</h3>
                    <form id="createSportForm">
                        <div class="form-group">
                            <label>Sport Name</label>
                            <input type="text" id="nSportName" required>
                        </div>
                        <div class="form-group">
                            <label>Description (Optional)</label>
                            <textarea id="nSportDesc" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Save Sport</button>
                    </form>
                </div>
                <div class="flex-col gap-4" style="grid-column: span 2;" id="sports-list">
                </div>
            </div>
        `;

        const list = document.getElementById('sports-list');
        if (sports.length === 0) {
            list.innerHTML = `<div class="card text-center text-muted">No sports created yet.</div>`;
        } else {
            sports.forEach(sport => {
                const card = document.createElement('div');
                card.className = 'card flex justify-between items-center';
                card.innerHTML = `
                    <div>
                        <div class="card-title">${sport.name}</div>
                        <div class="text-muted" style="margin-top: 0.25rem;">${sport.description || 'No description provided'}</div>
                    </div>
                `;
                const acts = document.createElement('div');
                acts.className = 'flex gap-4';

                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-danger btn-sm';
                delBtn.textContent = 'Delete';
                delBtn.onclick = async () => {
                    if (confirm(`Are you sure you want to delete ${sport.name}?`)) {
                        try {
                            await api.sports.delete(sport.id);
                            UI.showToast('Sport deleted');
                            app.render();
                        } catch (e) { UI.showToast(e.message, 'error'); }
                    }
                };

                acts.appendChild(delBtn);
                card.appendChild(acts);
                list.appendChild(card);
            });
        }

        document.getElementById('createSportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('nSportName').value;
            const desc = document.getElementById('nSportDesc').value;
            try {
                await api.sports.create(name, desc);
                UI.showToast('Sport created successfully');
                app.render();
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        });
    },

    renderReports(container) {
        // default 30 days ago to today
        const dEnd = new Date();
        const dStart = new Date();
        dStart.setDate(dStart.getDate() - 30);

        container.innerHTML = `
            <div class="card mb-8">
                <form id="reportFilterForm" class="flex items-center gap-4">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>Start Date</label>
                        <input type="date" id="rStart" value="${dStart.toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label>End Date</label>
                        <input type="date" id="rEnd" value="${dEnd.toISOString().split('T')[0]}" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 1.25rem;">Generate Report</button>
                </form>
            </div>
            
            <div id="report-results">
                <p class="text-muted text-center" style="margin-top: 2rem;">Select a date range and click generate.</p>
            </div>
        `;

        document.getElementById('reportFilterForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sd = document.getElementById('rStart').value;
            const ed = document.getElementById('rEnd').value;

            const results = document.getElementById('report-results');

            try {
                const data = await api.reports.getSessions(sd, ed);

                let popList = data.popularity.map(p => `
                    <div class="card flex justify-between items-center" style="padding: 1rem;">
                        <div class="card-title" style="margin: 0;">${p.sport}</div>
                        <div class="flex items-center gap-4">
                            <span class="text-muted text-sm">${p.session_count} Sessions</span>
                            <span class="badge badge-open" style="font-size: 1rem; background: var(--primary); color: white;">${p.percentage}</span>
                        </div>
                    </div>
                `).join('');

                if (data.popularity.length === 0) {
                    popList = `<div class="card text-center text-muted">No sessions played in this interval safely matched.</div>`;
                }

                results.innerHTML = `
                    <div class="grid grid-cols-2 mb-8" style="grid-template-columns: 1fr;">
                        <div class="stat-card">
                            <div class="stat-value">${data.total_played}</div>
                            <div class="stat-label mt-4">Total Played Sessions</div>
                            <div class="text-muted mt-4" style="font-size: 0.85rem;">Bounded exactly spanning ${data.period.startDate} safely up to ${data.period.endDate}</div>
                        </div>
                    </div>
                    
                    <h3 class="mb-4">Relative Sports Popularity</h3>
                    <div class="flex-col gap-4">
                        ${popList}
                    </div>
                `;

            } catch (err) {
                UI.showToast(err.message, 'error');
                results.innerHTML = `<p class="text-danger text-center mt-4">${err.message}</p>`;
            }
        });

        // Auto trigger initially
        document.getElementById('reportFilterForm').dispatchEvent(new Event('submit'));
    }
};
