// Freaze Market - Hidden Admin Panel Trigger Mechanisms
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== HIDDEN ADMIN PANEL TRIGGER MECHANISMS ==================== */
        // Mechanism 1: Secret Shortcut (Ctrl + Shift + A)
        function setupKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                    e.preventDefault();
                    triggerAdminAccess();
                }
            });
        }

        // Mechanism 2: Secret URL Parameter (?admin=true or #admin-login)
        function checkSecretUrlParams() {
            const urlParams = new URLSearchParams(window.location.search);
            const hash = window.location.hash;

            if (urlParams.get('admin') === 'true' || hash === '#admin-login' || hash === '#admin') {
                triggerAdminAccess();
            }
        }

        // Mechanism 3: Footer Rapid 5x Clicks Trigger
        function handleFooterSecretClick() {
            APP_STATE.footerClickCount++;
            clearTimeout(APP_STATE.footerClickTimer);

            if (APP_STATE.footerClickCount >= 5) {
                APP_STATE.footerClickCount = 0;
                showToast('🔑 Secret Admin Access Unlocked!', 'info');
                triggerAdminAccess();
            } else {
                APP_STATE.footerClickTimer = setTimeout(() => {
                    APP_STATE.footerClickCount = 0;
                }, 2000);
            }
        }

        function triggerAdminAccess() {
            if (APP_STATE.isAdminLoggedIn) {
                switchTab('admin-dashboard');
                showToast('Kembali ke Dashboard Admin', 'success');
            } else {
                showAdminLoginModal();
            }
        }
