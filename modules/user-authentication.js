// Freaze Market - Supabase User Authentication
function renderNavAuth() {
    const container = document.getElementById('nav-auth-section');
    if (!container) return;
    if (APP_STATE.currentUser) {
        const user = APP_STATE.currentUser;
        const displayName = user.username || user.fullName || user.email;
        container.innerHTML = `<div class="flex items-center gap-3"><div class="text-right hidden sm:block"><span class="text-xs font-bold text-white block">${escapeAuthText(displayName)}</span><span class="text-[10px] text-slate-400">${escapeAuthText(user.email || '')}</span></div><button onclick="handleUserLogout()" class="p-2 bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 rounded-xl transition" title="Keluar Akun"><i class="fa-solid fa-right-from-bracket"></i></button></div>`;
    } else {
        container.innerHTML = `<button onclick="showUserAuthModal('login')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-2"><i class="fa-solid fa-user"></i> Masuk / Daftar</button>`;
    }
}
function escapeAuthText(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function showUserAuthModal(subTab = 'login') {
    document.getElementById('user-auth-modal').classList.remove('hidden');
    switchAuthSubTab(subTab);
}
function closeUserAuthModal() { document.getElementById('user-auth-modal').classList.add('hidden'); }
function switchAuthSubTab(tab) {
    const btnLogin = document.getElementById('auth-tab-btn-login');
    const btnReg = document.getElementById('auth-tab-btn-register');
    const formLogin = document.getElementById('form-user-login');
    const formReg = document.getElementById('form-user-register');
    if (tab === 'login') {
        btnLogin.className = 'flex-1 py-3 text-sm font-bold text-blue-400 border-b-2 border-blue-500';
        btnReg.className = 'flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white';
        formLogin.classList.remove('hidden'); formReg.classList.add('hidden');
    } else {
        btnReg.className = 'flex-1 py-3 text-sm font-bold text-blue-400 border-b-2 border-blue-500';
        btnLogin.className = 'flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white';
        formReg.classList.remove('hidden'); formLogin.classList.add('hidden');
    }
}
async function handleGoogleFastLogin() {
    try { await fmStartGoogleLogin(); }
    catch (error) { showToast(fmDbError(error, 'Login Google gagal.'), 'error'); }
}
async function handleUserLoginSubmit(e) {
    e.preventDefault();
    if (!window.FREAZE_DB_READY) { showToast('Database belum dikonfigurasi. Buka README.md dan isi modules/supabase-config.js.', 'error'); return; }
    const email = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const submit = e.submitter; if (submit) submit.disabled = true;
    try {
        const { error } = await fmSupabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const user = await fmSyncCurrentUser();
        await fmLoadOrders();
        renderNavAuth(); closeUserAuthModal(); showToast('Berhasil masuk ke Freaze Market!', 'success');
    } catch (error) { showToast(fmDbError(error, 'Login gagal.'), 'error'); }
    finally { if (submit) submit.disabled = false; }
}
async function handleUserRegisterSubmit(e) {
    e.preventDefault();
    if (!window.FREAZE_DB_READY) { showToast('Database belum dikonfigurasi. Buka README.md dan isi modules/supabase-config.js.', 'error'); return; }
    const fullName = document.getElementById('reg-full-name').value.trim();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const dateOfBirth = document.getElementById('reg-date-of-birth').value;
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;
    if (password !== confirmPassword) { showToast('Konfirmasi kata sandi tidak sama.', 'error'); return; }
    if (!/^[a-z0-9_]{3,24}$/.test(username)) { showToast('Username harus 3–24 karakter: huruf, angka, atau underscore.', 'error'); return; }
    if (!dateOfBirth || dateOfBirth > new Date().toISOString().slice(0, 10)) { showToast('Tanggal lahir tidak valid.', 'error'); return; }
    const submit = e.submitter; if (submit) submit.disabled = true;
    try {
        const { data, error } = await fmSupabase.auth.signUp({
            email, password,
            options: { data: { username, full_name: fullName, date_of_birth: dateOfBirth }, emailRedirectTo: window.location.href.split('#')[0] }
        });
        if (error) throw error;
        if (data.session) {
            await fmSyncCurrentUser(); await fmAudit('auth.register', 'user', data.user?.id || null, { provider: 'email' });
            renderNavAuth(); closeUserAuthModal();
            showToast('Pendaftaran berhasil. Akun sudah aktif.', 'success');
        } else {
            closeUserAuthModal();
            showToast('Pendaftaran berhasil. Cek email untuk konfirmasi sebelum login.', 'success');
        }
    } catch (error) { showToast(fmDbError(error, 'Pendaftaran gagal.'), 'error'); }
    finally { if (submit) submit.disabled = false; }
}
async function handleUserLogout() {
    if (window.fmSupabase) {
        const { error } = await fmSupabase.auth.signOut();
        if (error) { showToast(fmDbError(error, 'Logout gagal.'), 'error'); return; }
    }
    APP_STATE.currentUser = null; APP_STATE.isAdminLoggedIn = false;
    try { localStorage.removeItem('fm_current_user'); } catch (_) {}
    renderNavAuth(); showToast('Berhasil keluar akun', 'info');
}
