// Freaze Market - Navigation & Tabs
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== NAVIGATION & TABS ==================== */
        function switchTab(tabId) {
            const tabs = ['home', 'catalog', 'order', 'cek-transaksi', 'admin-dashboard'];
            tabs.forEach(t => {
                const el = document.getElementById(`tab-${t}`);
                if (el) el.classList.add('hidden');
            });

            const activeEl = document.getElementById(`tab-${tabId}`);
            if (activeEl) activeEl.classList.remove('hidden');

            if (tabId === 'admin-dashboard') {
                if (!APP_STATE.isAdminLoggedIn) {
                    showAdminLoginModal();
                    switchTab('home');
                    return;
                }
                renderAdminDashboard();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
