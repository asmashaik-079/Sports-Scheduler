import { UI } from './ui.js';

const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';

    UI.showLoading();
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        }

        if (!res.ok) {
            throw new Error((data && data.error) ? data.error : `Request failed with status ${res.status}`);
        }
        return data;
    } finally {
        UI.hideLoading();
    }
}

export const api = {
    auth: {
        me: () => fetchAPI('/auth/me', { method: 'GET' }),
        login: (email, password) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        register: (name, email, password) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
        logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
        forgotPassword: (email) => fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
        resetPassword: (token, newPassword) => fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
        changePassword: (currentPassword, newPassword) => fetchAPI('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })
    },
    sports: {
        getAll: () => fetchAPI('/sports', { method: 'GET' }),
        create: (name, description) => fetchAPI('/sports', { method: 'POST', body: JSON.stringify({ name, description }) }),
        update: (id, name, description) => fetchAPI(`/sports/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),
        delete: (id) => fetchAPI(`/sports/${id}`, { method: 'DELETE' })
    },
    sessions: {
        getAll: () => fetchAPI('/sessions', { method: 'GET' }),
        getCreated: () => fetchAPI('/sessions/created', { method: 'GET' }),
        getJoined: () => fetchAPI('/sessions/joined', { method: 'GET' }),
        create: (data) => fetchAPI('/sessions', { method: 'POST', body: JSON.stringify(data) }),
        join: (id) => fetchAPI(`/sessions/${id}/join`, { method: 'POST' }),
        cancel: (id, reason) => fetchAPI(`/sessions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
    },
    reports: {
        getSessions: (startDate, endDate) => fetchAPI(`/reports/sessions?startDate=${startDate}&endDate=${endDate}`, { method: 'GET' })
    }
};
