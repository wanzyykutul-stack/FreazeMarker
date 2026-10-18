// Admin access is based on the authenticated Supabase account's database role, never a hard-coded passkey.
function showAdminLoginModal() { document.getElementById('admin-login-modal').classList.remove('hidden'); }
function closeAdminLoginModal() { document.getElementById('admin-login-modal').classList.add('hidden'); }
async function handleAdminLogin(e) {
    e.preventDefault();
    if (!window.FREAZE_DB_READY) { showToast('Supabase belum dikonfigurasi. Ikuti README.md.', 'error'); return; }
    try {
        const { data: { user }, error: authError } = await fmSupabase.auth.getUser();
        if (authError || !user) { showToast('Login dengan akun kamu terlebih dahulu.', 'error'); closeAdminLoginModal(); showUserAuthModal('login'); return; }
        const { data: profile, error } = await fmSupabase.from('profiles').select('role').eq('id', user.id).single();
        if (error) throw error;
        if (profile?.role !== 'admin') { await fmAudit('admin.access_denied', 'user', user.id, {}); showToast('Akun ini tidak memiliki hak akses admin.', 'error'); return; }
        APP_STATE.isAdminLoggedIn = true;
        if (APP_STATE.currentUser) APP_STATE.currentUser.role = 'admin';
        closeAdminLoginModal(); await fmLoadOrders();
        await fmAudit('admin.login', 'user', user.id, {});
        showToast('Akses admin terverifikasi.', 'success'); switchTab('admin-dashboard'); addBotLog('ADMIN SESSION VERIFIED BY SUPABASE ROLE.');
    } catch (error) { showToast(fmDbError(error, 'Verifikasi admin gagal.'), 'error'); }
}
async function logoutAdmin() {
    await fmAudit('admin.logout', 'user', APP_STATE.currentUser?.id || null, {});
    APP_STATE.isAdminLoggedIn = false; showToast('Panel admin dikunci', 'info'); switchTab('home'); addBotLog('ADMIN PANEL LOCKED.');
}
function lockAdminPanel() { logoutAdmin(); }
