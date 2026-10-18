// Freaze Market - Toast Notification Utility
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== TOAST NOTIFICATION UTILITY ==================== */
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            let bgStyle = 'bg-slate-900 border-slate-700 text-white';
            if (type === 'success') bgStyle = 'bg-emerald-950 border-emerald-500/50 text-emerald-200';
            if (type === 'error') bgStyle = 'bg-red-950 border-red-500/50 text-red-200';
            if (type === 'info') bgStyle = 'bg-blue-950 border-blue-500/50 text-blue-200';

            toast.className = `glass-card pointer-events-auto px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-2 transform transition duration-300 translate-y-2 ${bgStyle}`;
            toast.innerHTML = `
                <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : type === 'error' ? 'fa-triangle-exclamation text-red-400' : 'fa-circle-info text-blue-400'}"></i>
                <span>${message}</span>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('opacity-0', '-translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
