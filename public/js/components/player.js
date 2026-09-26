import { api } from '../api.js';
import { UI } from '../ui.js';

export const PlayerDashboard = {
    async render(container, app) {
        const hash = window.location.hash.substring(1);
        const currentTab = ['dashboard', 'created', 'joined', 'create'].includes(hash) ? hash : 'dashboard';

        container.innerHTML = `
            <div class="dash-header">
                <div>
                    <h2>Hello, ${app.user.name} 👋</h2>
                    <p class="text-muted">Find and schedule your upcoming games.</p>
                </div>
                <a href="#create" class="btn btn-primary">+ Create Session</a>
            </div>
            
            <div class="tabs">
                <a href="#dashboard" class="tab ${currentTab === 'dashboard' ? 'active' : ''}">Available Sessions</a>
                <a href="#joined" class="tab ${currentTab === 'joined' ? 'active' : ''}">My Joined</a>
                <a href="#created" class="tab ${currentTab === 'created' ? 'active' : ''}">My Created</a>
            </div>
            
            <div id="player-content"></div>
        `;

        const content = document.getElementById('player-content');

        try {
            if (currentTab === 'dashboard') {
                const data = await api.sessions.getAll();
                this.renderSessionList(content, data.sessions, 'Available', app);
            } else if (currentTab === 'created') {
                const data = await api.sessions.getCreated();
                this.renderSessionList(content, data.sessions, 'Created', app, true);
            } else if (currentTab === 'joined') {
                const data = await api.sessions.getJoined();
                this.renderSessionList(content, data.sessions, 'Joined', app);
            } else if (currentTab === 'create') {
                await this.renderCreateForm(content, app);
            }
        } catch (err) {
            content.innerHTML = `<div class="card text-center text-muted">Failed to load payload: ${err.message}</div>`;
        }
    },

    renderSessionList(container, sessions, type, app, isCreatedView = false) {
        if (!sessions || sessions.length === 0) {
            container.innerHTML = `
                <div class="card text-center" style="padding: 4rem 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏟️</div>
                    <h3>No ${type.toLowerCase()} sessions found</h3>
                    <p class="text-muted mt-4">We couldn't find any sessions matching this criteria.</p>
                </div>
            `;
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-3';

        sessions.forEach(session => {
            const card = document.createElement('div');
            card.className = 'card flex-col justify-between';

            let statusBadge = '';
            if (session.status === 'cancelled') {
                statusBadge = `<span class="badge badge-cancelled">Cancelled</span>`;
            } else {
                const isFull = parseInt(session.joined_count) >= session.additional_players_required;
                if (isFull) {
                    statusBadge = `<span class="badge badge-full">Full</span>`;
                } else {
                    statusBadge = `<span class="badge badge-open">Open</span>`;
                }
            }

            let joinedUsersStr = '';
            if (session.joined_players && session.joined_players.length > 0) {
                joinedUsersStr = session.joined_players.map(u => u.name).join(', ');
            } else {
                joinedUsersStr = '<span class="text-muted">None yet</span>';
            }

            card.innerHTML = `
                <div>
                    <div class="card-header">
                        <div>
                            <div class="card-title">${session.sport_name}</div>
                            <div class="card-meta">by ${session.creator_name || 'You'}</div>
                        </div>
                        ${statusBadge}
                    </div>
                    
                    <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
                        <div class="detail-row">
                            <span class="detail-label">When</span>
                            <span class="detail-value">${UI.formatDate(session.date)} at ${UI.formatTime(session.start_time)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Where</span>
                            <span class="detail-value">${session.venue}</span>
                        </div>
                        
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label mt-2">Team 1: ${session.team1_name || 'Team 1'}</span>
                            <span class="detail-value" style="font-weight: 400; font-size: 0.85rem; margin-top: 0.25rem;">
                                ${session.team1_players && session.team1_players.length ? session.team1_players.join(', ') : 'No players added'}
                            </span>
                        </div>
                        
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label mt-2">Team 2: ${session.team2_name || 'Team 2'}</span>
                            <span class="detail-value" style="font-weight: 400; font-size: 0.85rem; margin-top: 0.25rem;">
                                ${session.team2_players && session.team2_players.length ? session.team2_players.join(', ') : 'No players added'}
                            </span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Additional Players Needed</span>
                            <span class="detail-value">${session.additional_players_required}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Slots Filled</span>
                            <span class="detail-value">${session.joined_count} / ${session.additional_players_required}</span>
                        </div>
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start; border-bottom: none;">
                            <span class="detail-label mt-4">Joined Players:</span>
                            <span class="detail-value" style="font-weight: 400; font-size: 0.85rem; margin-top: 0.25rem;">${joinedUsersStr}</span>
                        </div>
                        ${session.cancellation_reason ? `
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start; background: rgba(239, 68, 68, 0.05); padding: 0.5rem; border-radius: 8px; margin-top: 0.5rem;">
                            <span class="detail-label" style="color: var(--danger);">Cancellation Reason:</span>
                            <span class="detail-value" style="font-size: 0.85rem;">${session.cancellation_reason}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // Actions dynamically rendered based on context and limits
            const actionContainer = document.createElement('div');
            actionContainer.className = 'mt-4';

            if (session.status !== 'cancelled') {
                if (isCreatedView && session.created_by === app.user.id) {
                    actionContainer.innerHTML = `<button class="btn btn-danger btn-sm" style="width: 100%;">Cancel Session</button>`;
                    actionContainer.querySelector('button').addEventListener('click', async () => {
                        const reason = prompt("Enter cancellation reason:");
                        if (reason) {
                            try {
                                await api.sessions.cancel(session.id, reason);
                                UI.showToast('Session cancelled');
                                app.render(); // refresh
                            } catch (err) {
                                UI.showToast(err.message, 'error');
                            }
                        }
                    });
                } else if (type === 'Available' && session.created_by !== app.user.id) {
                    const isFull = parseInt(session.joined_count) >= session.additional_players_required;
                    const thisUserJoined = session.joined_players && session.joined_players.find(u => u.id === app.user.id);
                    if (thisUserJoined) {
                        actionContainer.innerHTML = `<button class="btn btn-secondary btn-sm" disabled style="width: 100%;">Already Joined</button>`;
                    } else if (isFull) {
                        actionContainer.innerHTML = `<button class="btn btn-secondary btn-sm" disabled style="width: 100%;">Session Full</button>`;
                    } else {
                        actionContainer.innerHTML = `<button class="btn btn-primary btn-sm" style="width: 100%;">Join Session</button>`;
                        actionContainer.querySelector('button').addEventListener('click', async (e) => {
                            e.target.disabled = true;
                            try {
                                await api.sessions.join(session.id);
                                UI.showToast('Successfully joined session');
                                app.render();
                            } catch (err) {
                                UI.showToast(err.message, 'error');
                                e.target.disabled = false;
                            }
                        });
                    }
                }
            }

            card.appendChild(actionContainer);
            grid.appendChild(card);
        });

        container.appendChild(grid);
    },

    async renderCreateForm(container, app) {
        container.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <h3 class="mb-4">Create New Session</h3>
                <form id="createSessionForm">
                    <div class="form-group">
                        <label>Sport</label>
                        <select id="sportId" required></select>
                    </div>
                    
                    <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 1rem;">Team 1</h4>
                        <div class="form-group">
                            <label>Team 1 Name</label>
                            <input type="text" id="team1Name" required placeholder="e.g. Red Team">
                        </div>
                        <div class="form-group">
                            <label>Existing Players</label>
                            <div id="team1PlayersList" style="margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;"></div>
                            <button type="button" id="addTeam1PlayerBtn" class="btn btn-secondary btn-sm">+ Add Player</button>
                        </div>
                    </div>

                    <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 1rem;">Team 2</h4>
                        <div class="form-group">
                            <label>Team 2 Name</label>
                            <input type="text" id="team2Name" required placeholder="e.g. Blue Team">
                        </div>
                        <div class="form-group">
                            <label>Existing Players</label>
                            <div id="team2PlayersList" style="margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;"></div>
                            <button type="button" id="addTeam2PlayerBtn" class="btn btn-secondary btn-sm">+ Add Player</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" id="sDate" required>
                        </div>
                        <div class="form-group">
                            <label>Start Time</label>
                            <input type="time" id="sTime" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Venue</label>
                        <input type="text" id="sVenue" required placeholder="e.g. Downtown Arena">
                    </div>
                    <div class="form-group">
                        <label>Additional Players Required</label>
                        <input type="number" id="sPlayers" required min="0" placeholder="e.g. 9 for a 5v5 game">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Create Session</button>
                </form>
            </div>
        `;

        const createPlayerRow = (listId) => {
            const list = document.getElementById(listId);
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '0.5rem';
            row.innerHTML = `
                <input type="text" class="player-name-input" placeholder="Player name" style="flex: 1;" required>
                <button type="button" class="btn btn-danger btn-sm remove-player-btn">Remove</button>
            `;
            row.querySelector('.remove-player-btn').addEventListener('click', () => row.remove());
            list.appendChild(row);
        };

        document.getElementById('addTeam1PlayerBtn').addEventListener('click', () => createPlayerRow('team1PlayersList'));
        document.getElementById('addTeam2PlayerBtn').addEventListener('click', () => createPlayerRow('team2PlayersList'));

        try {
            const { sports } = await api.sports.getAll();
            const select = document.getElementById('sportId');
            if (sports.length === 0) {
                select.innerHTML = '<option value="">No sports available. Ask admin to create one.</option>';
            } else {
                sports.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    select.appendChild(opt);
                });
            }
        } catch (e) {
            UI.showToast('Failed to load sports', 'error');
        }

        document.getElementById('createSessionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const team1Players = Array.from(document.getElementById('team1PlayersList').querySelectorAll('.player-name-input')).map(inp => inp.value.trim()).filter(v => v);
            const team2Players = Array.from(document.getElementById('team2PlayersList').querySelectorAll('.player-name-input')).map(inp => inp.value.trim()).filter(v => v);
            
            const payload = {
                sport_id: document.getElementById('sportId').value,
                date: document.getElementById('sDate').value,
                start_time: document.getElementById('sTime').value,
                venue: document.getElementById('sVenue').value,
                additional_players_required: parseInt(document.getElementById('sPlayers').value, 10),
                team1_name: document.getElementById('team1Name').value,
                team2_name: document.getElementById('team2Name').value,
                team1_players: team1Players,
                team2_players: team2Players
            };

            try {
                await api.sessions.create(payload);
                UI.showToast('Session created successfully!');
                app.navigate('dashboard');
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        });
    }
};
