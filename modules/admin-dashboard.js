// Freaze Market - Hidden Admin Controller Logic
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== HIDDEN ADMIN CONTROLLER LOGIC ==================== */
        function renderAdminDashboard() {
            // Render Stats
            document.getElementById('stat-total-tx').innerText = APP_STATE.orders.length;
            const pendingCount = APP_STATE.orders.filter(o => ['pending', 'PENDING_MANUAL', 'PROCESSING_BOT'].includes(o.status)).length;
            document.getElementById('stat-pending-tx').innerText = pendingCount;

            const totalRev = APP_STATE.orders.reduce((sum, o) => sum + o.totalPrice, 0);
            document.getElementById('stat-total-revenue').innerText = `Rp ${totalRev.toLocaleString('id-ID')}`;

            document.getElementById('stat-admin-fee-balance').innerText = `Rp ${APP_STATE.adminProfitBalance.toLocaleString('id-ID')}`;
            document.getElementById('withdraw-available-amount').innerText = `Rp ${APP_STATE.adminProfitBalance.toLocaleString('id-ID')}`;

            // Sync Fee Setting Inputs
            document.getElementById('setting-fee-type').value = APP_STATE.adminFeeSetting.type;
            document.getElementById('setting-fee-value').value = APP_STATE.adminFeeSetting.value;

            // Render Orders Table
            const tbody = document.getElementById('admin-orders-tbody');
            if (!tbody) return;

            if (APP_STATE.orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-500">Belum ada transaksi masuk.</td></tr>`;
                return;
            }

            tbody.innerHTML = APP_STATE.orders.map(order => `
                <tr class="hover:bg-slate-900/50 transition">
                    <td class="py-3 px-3">
                        <span class="font-bold text-cyan-400 block">${order.invoiceId}</span>
                        <span class="text-[10px] text-slate-400">${order.gameName} - ${order.packageName}</span>
                    </td>
                    <td class="py-3 px-3 font-mono text-[11px] text-slate-300 max-w-xs truncate">${order.accountDetail}</td>
                    <td class="py-3 px-3 font-bold text-white">Rp ${order.totalPrice.toLocaleString('id-ID')}</td>
                    <td class="py-3 px-3">
                        ${['SUCCESS','success'].includes(order.status) ? '<span class="text-emerald-400 font-semibold">Success</span>' : ''}
                        ${['pending','PENDING_MANUAL','PROCESSING_BOT'].includes(order.status) ? '<span class="text-amber-400 font-semibold">Pending</span>' : ''}
                        ${['failed','REJECTED'].includes(order.status) ? '<span class="text-red-400 font-semibold">Failed</span>' : ''}
                        ${order.status === 'cancelled' ? '<span class="text-slate-400 font-semibold">Cancelled</span>' : ''}
                        ${order.status === 'refund' ? '<span class="text-purple-400 font-semibold">Refund</span>' : ''}
                    </td>
                    <td class="py-3 px-3 text-center">
                        ${['pending','PENDING_MANUAL','PROCESSING_BOT'].includes(order.status) ? `
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="approveAdminOrder('${order.invoiceId}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold">Approve</button>
                                <button onclick="rejectAdminOrder('${order.invoiceId}')" class="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold">Reject</button>
                            </div>
                        ` : '<span class="text-slate-600 text-[10px]">- Selesai -</span>'}
                    </td>
                </tr>
            `).join('');

            renderBotLogs();
        }

        async function approveAdminOrder(invId) {
            const order = APP_STATE.orders.find(o => o.invoiceId === invId);
            if (!order) return;
            try {
                await fmUpdateOrderStatus(order, 'success');
                APP_STATE.adminProfitBalance += Number(order.adminFee || 0);
                saveLocalStorageData();
                addBotLog(`ADMIN APPROVED: ${invId}. Status stored in Supabase.`);
                showToast(`Invoice ${invId} berhasil disetujui!`, 'success');
                renderAdminDashboard();
            } catch (error) { showToast(fmDbError(error, 'Gagal memperbarui pesanan.'), 'error'); }
        }

        async function rejectAdminOrder(invId) {
            const order = APP_STATE.orders.find(o => o.invoiceId === invId);
            if (!order) return;
            try {
                await fmUpdateOrderStatus(order, 'failed');
                addBotLog(`ADMIN MARKED FAILED: ${invId}. Status stored in Supabase.`);
                showToast(`Invoice ${invId} ditandai gagal.`, 'info');
                renderAdminDashboard();
            } catch (error) { showToast(fmDbError(error, 'Gagal memperbarui pesanan.'), 'error'); }
        }

        function saveAdminFeeSettings(e) {
            e.preventDefault();
            const type = document.getElementById('setting-fee-type').value;
            const value = parseFloat(document.getElementById('setting-fee-value').value);

            if (isNaN(value) || value < 0) {
                showToast('Masukkan nilai fee yang valid!', 'error');
                return;
            }

            APP_STATE.adminFeeSetting = { type, value };
            saveLocalStorageData();
            showToast('Pengaturan Biaya Admin Berhasil Disimpan!', 'success');
            addBotLog(`ADMIN SETTING CHANGED: Fee type set to ${type} (${value})`);
        }

        function handleWithdrawSubmit(e) {
            e.preventDefault();
            const bank = document.getElementById('withdraw-bank').value;
            const accountNo = document.getElementById('withdraw-account-no').value;
            const amount = parseFloat(document.getElementById('withdraw-amount').value);

            if (isNaN(amount) || amount < 10000) {
                showToast('Minimal Penarikan Rp 10.000!', 'error');
                return;
            }

            if (amount > APP_STATE.adminProfitBalance) {
                showToast('Saldo Profit Tidak Mencukupi!', 'error');
                return;
            }

            APP_STATE.adminProfitBalance -= amount;
            saveLocalStorageData();
            showToast(`Penarikan Rp ${amount.toLocaleString('id-ID')} ke ${bank} (${accountNo}) Berhasil Diproses!`, 'success');
            addBotLog(`WITHDRAW PROCESSED: Rp ${amount} transferred to ${bank} - ${accountNo}`);
            renderAdminDashboard();
        }

        function addBotLog(msg) {
            const timestamp = new Date().toLocaleTimeString('id-ID');
            APP_STATE.botLogs.unshift(`[${timestamp}] ${msg}`);
            renderBotLogs();
        }

        function renderBotLogs() {
            const container = document.getElementById('bot-logs-container');
            if (!container) return;

            container.innerHTML = APP_STATE.botLogs.map(log => `
                <div class="leading-relaxed hover:bg-slate-900/80 px-1 rounded"><span class="text-slate-500">&gt;</span> ${log}</div>
            `).join('');
        }
