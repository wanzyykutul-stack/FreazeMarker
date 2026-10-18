// Freaze Market - Invoice & Search
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== INVOICE & SEARCH ==================== */
        function searchInvoice() {
            const invId = document.getElementById('search-invoice-input')?.value.trim().toUpperCase();
            if (!invId) {
                showToast('Masukkan Nomor Invoice!', 'error');
                return;
            }

            const found = APP_STATE.orders.find(o => o.invoiceId === invId);
            if (!found) {
                showToast('Nomor Invoice Tidak Ditemukan!', 'error');
                return;
            }

            displayInvoiceResult(found);
        }

        function displayInvoiceResult(order) {
            const container = document.getElementById('invoice-result-card');
            if (!container) return;

            container.classList.remove('hidden');

            let statusBadge = '';
            if (['SUCCESS', 'success'].includes(order.status)) {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><i class="fa-solid fa-circle-check"></i> TRANSAKSI SUKSES</span>';
            } else if (['pending', 'PENDING_MANUAL'].includes(order.status)) {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><i class="fa-solid fa-clock"></i> MENUNGGU VERIFIKASI ADMIN</span>';
            } else if (order.status === 'PROCESSING_BOT') {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse"><i class="fa-solid fa-spinner fa-spin"></i> PROSES BOT OTOMATIS</span>';
            } else if (order.status === 'cancelled') {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">DIBATALKAN</span>';
            } else if (order.status === 'refund') {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">REFUND</span>';
            } else {
                statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30"><i class="fa-solid fa-circle-xmark"></i> DITOLAK / GAGAL</span>'; 
            }

            container.innerHTML = `
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                    <div>
                        <span class="text-xs text-slate-400">Nomor Invoice</span>
                        <h3 class="text-xl font-extrabold text-cyan-400 tracking-wider">${order.invoiceId}</h3>
                    </div>
                    <div>${statusBadge}</div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div class="space-y-2">
                        <div><span class="text-slate-500">Tanggal:</span> <span class="font-semibold text-white">${order.date}</span></div>
                        <div><span class="text-slate-500">Item Game:</span> <span class="font-semibold text-white">${order.gameName} - ${order.packageName}</span></div>
                        <div><span class="text-slate-500">Detail Akun:</span> <span class="font-mono text-cyan-300">${order.accountDetail}</span></div>
                    </div>
                    <div class="space-y-2">
                        <div><span class="text-slate-500">Metode Pembayaran:</span> <span class="font-semibold text-white">${order.paymentMethod}</span></div>
                        <div><span class="text-slate-500">Biaya Admin:</span> <span class="font-semibold text-amber-400">Rp ${order.adminFee.toLocaleString('id-ID')}</span></div>
                        <div><span class="text-slate-500">Total Tagihan:</span> <span class="font-extrabold text-lg text-emerald-400">Rp ${order.totalPrice.toLocaleString('id-ID')}</span></div>
                    </div>
                </div>

                <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-2">
                    <p class="text-xs text-slate-400"><i class="fa-solid fa-circle-info text-blue-400"></i> Simpan Invoice ini sebagai bukti transaksi resmi di Freaze Market.</p>
                </div>
            `;
        }
