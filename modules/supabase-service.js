// Supabase adapter: auth, profiles, orders, audit events and notification invocation.
// Works in configured mode; never falls back to pretending an unconfigured login succeeded.
(function () {
    const config = window.FREAZE_SUPABASE_CONFIG || {};
    const validConfig = config.url && config.anonKey &&
        !config.url.includes('YOUR_PROJECT_ID') && !config.anonKey.includes('YOUR_SUPABASE');
    window.FREAZE_DB_READY = Boolean(validConfig && window.supabase?.createClient);
    window.fmSupabase = window.FREAZE_DB_READY
        ? window.supabase.createClient(config.url, config.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        })
        : null;

    window.fmDbError = function (error, fallback = 'Terjadi kesalahan database.') {
        console.error('[Freaze Market / Supabase]', error);
        const message = error?.message || fallback;
        if (/duplicate key|profiles_username_key|username/i.test(message)) return 'Username sudah digunakan. Silakan pilih username lain.';
        if (/invalid login credentials/i.test(message)) return 'Email atau kata sandi salah.';
        if (/email not confirmed/i.test(message)) return 'Periksa email untuk konfirmasi akun sebelum login.';
        if (/row-level security|permission denied|not authorized/i.test(message)) return 'Akses ditolak oleh aturan keamanan database.';
        return message;
    };

    window.fmAudit = async function (action, entityType = 'system', entityId = null, details = {}) {
        if (!window.fmSupabase) return;
        try {
            await window.fmSupabase.from('audit_logs').insert({
                actor_id: APP_STATE.currentUser?.id || null, action, entity_type: entityType, entity_id: entityId,
                details: details && typeof details === 'object' ? details : {},
                user_agent: navigator.userAgent
            });
        } catch (error) { console.warn('Audit log gagal ditulis', error); }
    };

    window.fmNotify = async function (eventType, orderId = null) {
        if (!window.fmSupabase) return;
        try {
            const { error } = await window.fmSupabase.functions.invoke('send-notification', {
                body: { event_type: eventType, order_id: orderId }
            });
            if (error) console.warn('Notifikasi email belum terkirim:', error.message);
        } catch (error) { console.warn('Notifikasi email belum terkirim:', error); }
    };

    window.fmSyncCurrentUser = async function () {
        if (!window.fmSupabase) return null;
        const { data: { user }, error } = await window.fmSupabase.auth.getUser();
        if (error || !user) return null;
        const { data: profile, error: profileError } = await window.fmSupabase
            .from('profiles').select('id, username, full_name, date_of_birth, role, created_at')
            .eq('id', user.id).maybeSingle();
        if (profileError) console.warn('Profil belum dapat dimuat:', profileError.message);
        const current = {
            id: user.id,
            email: user.email,
            username: profile?.username || user.user_metadata?.username || (user.email || '').split('@')[0],
            fullName: profile?.full_name || user.user_metadata?.full_name || '',
            dateOfBirth: profile?.date_of_birth || user.user_metadata?.date_of_birth || null,
            role: profile?.role || 'user',
            createdDate: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : ''
        };
        APP_STATE.currentUser = current;
        APP_STATE.isAdminLoggedIn = current.role === 'admin';
        try { localStorage.setItem('fm_current_user', JSON.stringify(current)); } catch (_) {}
        return current;
    };

    window.fmLoadOrders = async function () {
        if (!window.fmSupabase || !APP_STATE.currentUser) return;
        const { data, error } = await window.fmSupabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
        if (error) { console.warn('Order tidak dapat dimuat:', error.message); return; }
        APP_STATE.orders = (data || []).map(row => ({
            dbId: row.id, invoiceId: row.invoice_number, date: new Date(row.created_at).toLocaleString('id-ID'),
            gameName: row.game_name, packageName: row.package_name, accountDetail: row.account_detail,
            paymentMethod: row.payment_method, basePrice: Number(row.base_price), adminFee: Number(row.admin_fee),
            totalPrice: Number(row.total_price), status: row.status, buyerUser: row.buyer_username || '',
            userId: row.user_id, paymentStatus: row.payment_status
        }));
        if (typeof renderAdminDashboard === 'function' && APP_STATE.isAdminLoggedIn) renderAdminDashboard();
    };

    window.fmCreateOrder = async function (order) {
        if (!window.fmSupabase || !APP_STATE.currentUser?.id) {
            throw new Error('Silakan login menggunakan Supabase sebelum membuat pesanan.');
        }
        const payload = {
            invoice_number: order.invoiceId,
            user_id: APP_STATE.currentUser.id,
            buyer_username: APP_STATE.currentUser.username,
            buyer_email: APP_STATE.currentUser.email,
            game_name: order.gameName,
            package_name: order.packageName,
            account_detail: order.accountDetail,
            payment_method: order.paymentMethod,
            base_price: order.basePrice,
            admin_fee: order.adminFee,
            total_price: order.totalPrice,
            status: 'pending',
            payment_status: 'pending',
            metadata: { source: 'website' }
        };
        const { data, error } = await window.fmSupabase.from('orders').insert(payload).select('*').single();
        if (error) throw error;
        order.dbId = data.id;
        order.status = data.status;
        order.paymentStatus = data.payment_status;
        await window.fmNotify('order_created', data.id);
        return data;
    };

    window.fmUpdateOrderStatus = async function (order, status) {
        if (!window.fmSupabase || !APP_STATE.currentUser) throw new Error('Sesi login Supabase tidak ditemukan.');
        if (!APP_STATE.isAdminLoggedIn || APP_STATE.currentUser.role !== 'admin') throw new Error('Hanya admin terdaftar yang dapat mengubah status pesanan.');
        if (!['pending', 'success', 'failed', 'cancelled', 'refund'].includes(status)) throw new Error('Status pesanan tidak valid.');
        if (!order.dbId) throw new Error('Pesanan ini belum tersinkronisasi ke database.');
        const { data, error } = await window.fmSupabase.from('orders').update({
            status, payment_status: status === 'success' ? 'paid' : status === 'refund' ? 'refunded' : status === 'failed' || status === 'cancelled' ? status : 'pending'
        }).eq('id', order.dbId).select('*').single();
        if (error) throw error;
        order.status = data.status;
        order.paymentStatus = data.payment_status;
        await window.fmNotify('order_status_changed', data.id);
        return data;
    };

    window.fmStartGoogleLogin = async function () {
        if (!window.fmSupabase) throw new Error('Supabase belum dikonfigurasi. Ikuti README.md terlebih dahulu.');
        const { error } = await window.fmSupabase.auth.signInWithOAuth({
            provider: 'google', options: { redirectTo: window.location.href.split('#')[0] }
        });
        if (error) throw error;
    };

    if (window.fmSupabase) {
        window.fmSupabase.auth.onAuthStateChange((event, session) => {
            // Avoid doing extra Supabase calls inside auth callback to prevent lock/deadlock.
            if (event === 'SIGNED_OUT') {
                APP_STATE.currentUser = null;
                APP_STATE.isAdminLoggedIn = false;
                try { localStorage.removeItem('fm_current_user'); } catch (_) {}
                if (typeof renderNavAuth === 'function') renderNavAuth();
            } else if (session?.user) {
                setTimeout(async () => {
                    try {
                        await window.fmSyncCurrentUser();
                        await window.fmLoadOrders();
                        if (typeof renderNavAuth === 'function') renderNavAuth();
                        if (event === 'SIGNED_IN') {
                            await window.fmAudit('auth.login', 'user', session.user.id, { provider: session.user.app_metadata?.provider || 'email' });
                            await window.fmNotify('login');
                            if (typeof showToast === 'function') showToast('Berhasil masuk ke Freaze Market!', 'success');
                        }
                    } catch (error) { console.error(error); }
                }, 0);
            }
        });
    }
})();
