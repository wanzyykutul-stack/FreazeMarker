// Freaze Market - Checkout & Payment Processor
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== CHECKOUT & PAYMENT PROCESSOR ==================== */
        async function processCheckout() {
            if (!APP_STATE.selectedPackage) {
                showToast('Pilih Nominal Top-Up Terlebih Dahulu!', 'error');
                return;
            }
            if (!window.FREAZE_DB_READY) { showToast('Database belum dikonfigurasi. Ikuti README.md.', 'error'); return; }
            if (!APP_STATE.currentUser?.id) { showToast('Silakan login terlebih dahulu untuk membuat pesanan.', 'error'); showUserAuthModal('login'); return; }

            // Extract account detail
            let accountDetail = '';
            const game = APP_STATE.selectedGame;

            if (game.type === 'roblox') {
                const rbxType = document.getElementById('roblox-type-select')?.value;
                if (rbxType === 'username') {
                    const u = document.getElementById('input-roblox-user')?.value;
                    if (!u) { showToast('Masukkan Username Roblox!', 'error'); return; }
                    accountDetail = `Username: ${u} (Otomatis Gamepass)`;
                } else {
                    const u = document.getElementById('input-roblox-login-user')?.value;
                    const p = document.getElementById('input-roblox-login-pass')?.value;
                    if (!u || !p) { showToast('Lengkapi ID & Pass Login Roblox!', 'error'); return; }
                    accountDetail = `Login Manual Admin -> ID: ${u} | Pass: ${p}`;
                }
            } else if (game.type === 'mlbb_id') {
                const id = document.getElementById('input-ml-id')?.value;
                const zone = document.getElementById('input-ml-zone')?.value;
                if (!id || !zone) { showToast('Lengkapi User ID & Zone ID!', 'error'); return; }
                accountDetail = `ID: ${id} (${zone})`;
            } else if (game.type === 'genshin_id') {
                const uid = document.getElementById('input-genshin-uid')?.value;
                const server = document.getElementById('input-genshin-server')?.value;
                if (!uid) { showToast('Masukkan UID Genshin!', 'error'); return; }
                accountDetail = `UID: ${uid} | Server: ${server}`;
            } else {
                const id = document.getElementById('input-generic-id')?.value;
                if (!id) { showToast('Masukkan ID Player!', 'error'); return; }
                accountDetail = `ID: ${id}`;
            }

            const now = new Date();
            const dateStr = now.getFullYear().toString() + (now.getMonth()+1).toString().padStart(2,'0') + now.getDate().toString().padStart(2,'0');
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const invoiceId = `INV-${dateStr}-${randomCode}`;

            const basePrice = APP_STATE.selectedPackage.price;
            const fee = calculateAdminFee(basePrice);
            const totalPrice = basePrice + fee;

            // Determine if auto process by Bot or Manual Admin
            let isManualProcess = (game.type === 'roblox' && document.getElementById('roblox-type-select')?.value === 'login');
            let initialStatus = 'pending';

            const newOrder = {
                invoiceId,
                date: now.toLocaleString('id-ID'),
                gameName: game.name,
                packageName: APP_STATE.selectedPackage.name,
                accountDetail,
                paymentMethod: APP_STATE.selectedPayment.name,
                basePrice,
                adminFee: fee,
                totalPrice,
                status: initialStatus,
                buyerUser: APP_STATE.currentUser.username,
                userId: APP_STATE.currentUser.id,
                paymentStatus: 'pending'
            };

            try {
                await fmCreateOrder(newOrder);
                APP_STATE.orders.unshift(newOrder);
                saveLocalStorageData();
                addBotLog(`NEW ORDER SAVED TO DATABASE: ${invoiceId} - ${game.name} - Rp ${totalPrice}`);
                showToast('Pesanan berhasil dibuat dan menunggu verifikasi admin.', 'success');
                displayInvoiceResult(newOrder);
                switchTab('cek-transaksi');
            } catch (error) {
                showToast(fmDbError(error, 'Pesanan gagal disimpan.'), 'error');
                console.error(error);
            }
        }
