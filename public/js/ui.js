export const UI = {
    showLoading() {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.remove('hidden');
    },
    hideLoading() {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    },
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    formatDate(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    },
    formatTime(timeString) {
        if (!timeString) return '';
        const [h, m] = timeString.split(':');
        const d = new Date();
        d.setHours(h, m, 0);
        return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
};
