// Freaze Market - Initialization
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== INITIALIZATION ==================== */
        window.onload = async function() {
            loadLocalStorageData();
            renderNavAuth();
            renderHomeGames();
            renderCatalog();
            checkSecretUrlParams();
            setupKeyboardShortcuts();
            if (window.FREAZE_DB_READY) {
                try { await fmSyncCurrentUser(); await fmLoadOrders(); }
                catch (error) { console.warn('Supabase session restore:', error); }
                renderNavAuth();
            }
            addBotLog(window.FREAZE_DB_READY ? "SUPABASE CONNECTION CONFIGURED." : "SUPABASE NOT CONFIGURED. See README.md.");
        };

        function loadLocalStorageData() {
            const savedFee = localStorage.getItem('fm_admin_fee');
            if (savedFee) APP_STATE.adminFeeSetting = JSON.parse(savedFee);

            const savedProfit = localStorage.getItem('fm_admin_profit');
            if (savedProfit) APP_STATE.adminProfitBalance = parseFloat(savedProfit);

            const savedOrders = localStorage.getItem('fm_orders');
            if (!window.FREAZE_DB_READY && savedOrders) APP_STATE.orders = JSON.parse(savedOrders);

            // With Supabase configured, localStorage is not an authentication source.
            const savedUser = localStorage.getItem('fm_current_user');
            if (!window.FREAZE_DB_READY && savedUser) APP_STATE.currentUser = JSON.parse(savedUser);
            if (window.FREAZE_DB_READY) { APP_STATE.currentUser = null; APP_STATE.orders = []; localStorage.removeItem('fm_current_user'); } 
        }

        function saveLocalStorageData() {
            localStorage.setItem('fm_admin_fee', JSON.stringify(APP_STATE.adminFeeSetting));
            localStorage.setItem('fm_admin_profit', APP_STATE.adminProfitBalance.toString());
            localStorage.setItem('fm_orders', JSON.stringify(APP_STATE.orders));
            if (APP_STATE.currentUser) {
                localStorage.setItem('fm_current_user', JSON.stringify(APP_STATE.currentUser));
            } else {
                localStorage.removeItem('fm_current_user');
            }
        }
