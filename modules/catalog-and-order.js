// Freaze Market - Catalog & Order Rendering
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== CATALOG & ORDER RENDERING ==================== */
        function renderHomeGames() {
            const container = document.getElementById('home-game-grid');
            if (!container) return;

            const popular = GAME_CATALOG.slice(0, 4);
            container.innerHTML = popular.map(game => `
                <div onclick="openOrderForm('${game.id}')" class="glass-card rounded-2xl p-4 border border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition transform hover:-translate-y-1 flex flex-col items-center text-center">
                    <img src="${game.image}" alt="${game.name}" class="w-20 h-20 rounded-xl object-cover mb-3">
                    <h3 class="font-bold text-white text-sm">${game.name}</h3>
                    <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${game.desc}</p>
                </div>
            `).join('');
        }

        function renderCatalog() {
            const container = document.getElementById('catalog-game-grid');
            if (!container) return;

            const query = (document.getElementById('catalog-search')?.value || '').toLowerCase();
            const filtered = GAME_CATALOG.filter(g => g.name.toLowerCase().includes(query));

            container.innerHTML = filtered.map(game => `
                <div onclick="openOrderForm('${game.id}')" class="glass-card rounded-2xl p-4 border border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition transform hover:-translate-y-1 flex flex-col items-center text-center">
                    <img src="${game.image}" alt="${game.name}" class="w-20 h-20 rounded-xl object-cover mb-3">
                    <h3 class="font-bold text-white text-sm">${game.name}</h3>
                    <p class="text-[11px] text-slate-400 mt-1 line-clamp-1">${game.desc}</p>
                </div>
            `).join('');
        }

        function openOrderForm(gameId) {
            const game = GAME_CATALOG.find(g => g.id === gameId);
            if (!game) return;

            APP_STATE.selectedGame = game;
            APP_STATE.selectedPackage = null;
            APP_STATE.selectedPayment = PAYMENT_METHODS[0]; // default QRIS

            document.getElementById('order-game-img').src = game.image;
            document.getElementById('order-game-title').innerText = game.name;
            document.getElementById('order-game-desc').innerText = game.desc;

            // Render Account Input Fields according to game type
            const inputContainer = document.getElementById('order-account-inputs');
            if (game.type === 'roblox') {
                inputContainer.innerHTML = `
                    <div class="col-span-2 space-y-3">
                        <label class="block text-xs font-semibold text-slate-300">Pilih Tipe Metode Roblox</label>
                        <select id="roblox-type-select" onchange="toggleRobloxForm(this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white">
                            <option value="username">Via Username Only (Otomatis Gamepass)</option>
                            <option value="login">Via Login Akun (Diproses Manual Admin)</option>
                        </select>
                    </div>
                    <div id="roblox-field-username" class="col-span-2">
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Username Roblox</label>
                        <input type="text" id="input-roblox-user" placeholder="Contoh: RobloxUser123" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                    </div>
                    <div id="roblox-field-login" class="col-span-2 hidden space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Username / Gmail Roblox</label>
                            <input type="text" id="input-roblox-login-user" placeholder="Masukkan ID Login" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Password Roblox</label>
                            <input type="password" id="input-roblox-login-pass" placeholder="••••••••" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                        </div>
                    </div>
                `;
            } else if (game.type === 'mlbb_id') {
                inputContainer.innerHTML = `
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">User ID</label>
                        <input type="number" id="input-ml-id" placeholder="Contoh: 12345678" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Zone ID</label>
                        <input type="number" id="input-ml-zone" placeholder="Contoh: 1234" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                    </div>
                `;
            } else if (game.type === 'genshin_id') {
                inputContainer.innerHTML = `
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">User ID (UID)</label>
                        <input type="number" id="input-genshin-uid" placeholder="Contoh: 812345678" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Server</label>
                        <select id="input-genshin-server" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white">
                            <option value="Asia">Asia</option>
                            <option value="America">America</option>
                            <option value="Europe">Europe</option>
                            <option value="TW_HK_MO">TW / HK / MO</option>
                        </select>
                    </div>
                `;
            } else {
                inputContainer.innerHTML = `
                    <div class="col-span-2">
                        <label class="block text-xs font-semibold text-slate-300 mb-1">ID Player / Riot ID / OpenID</label>
                        <input type="text" id="input-generic-id" placeholder="Masukkan ID Player Game Kamu" class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500">
                    </div>
                `;
            }

            // Render Packages
            const pkgContainer = document.getElementById('order-packages-grid');
            pkgContainer.innerHTML = game.packages.map((pkg, idx) => `
                <div id="pkg-card-${pkg.id}" onclick="selectPackage('${pkg.id}')" class="pkg-card glass-card rounded-xl p-4 border border-slate-800 hover:border-blue-500 cursor-pointer transition flex flex-col justify-between">
                    <span class="font-bold text-white text-xs">${pkg.name}</span>
                    <span class="text-cyan-400 font-extrabold text-sm mt-2">Rp ${pkg.price.toLocaleString('id-ID')}</span>
                </div>
            `).join('');

            // Render Payments
            renderPaymentMethods();
            updateOrderSummary();

            switchTab('order');
        }

        function toggleRobloxForm(type) {
            if (type === 'username') {
                document.getElementById('roblox-field-username').classList.remove('hidden');
                document.getElementById('roblox-field-login').classList.add('hidden');
            } else {
                document.getElementById('roblox-field-username').classList.add('hidden');
                document.getElementById('roblox-field-login').classList.remove('hidden');
            }
        }

        function selectPackage(pkgId) {
            if (!APP_STATE.selectedGame) return;
            const pkg = APP_STATE.selectedGame.packages.find(p => p.id === pkgId);
            if (!pkg) return;

            APP_STATE.selectedPackage = pkg;

            document.querySelectorAll('.pkg-card').forEach(el => {
                el.classList.remove('border-blue-500', 'bg-blue-600/20');
            });

            const activeCard = document.getElementById(`pkg-card-${pkgId}`);
            if (activeCard) activeCard.classList.add('border-blue-500', 'bg-blue-600/20');

            updateOrderSummary();
        }

        function renderPaymentMethods() {
            const container = document.getElementById('order-payments-list');
            if (!container) return;

            container.innerHTML = PAYMENT_METHODS.map(pay => `
                <div onclick="selectPaymentMethod('${pay.id}')" id="pay-card-${pay.id}" class="pay-card glass-card p-4 rounded-xl border border-slate-800 hover:border-blue-500 cursor-pointer transition flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid ${pay.icon} text-lg text-blue-400"></i>
                        <span class="font-bold text-white text-xs">${pay.name}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">${pay.feeNotice}</span>
                </div>
            `).join('');

            selectPaymentMethod('qris');
        }

        function selectPaymentMethod(payId) {
            const pay = PAYMENT_METHODS.find(p => p.id === payId);
            if (!pay) return;

            APP_STATE.selectedPayment = pay;

            document.querySelectorAll('.pay-card').forEach(el => {
                el.classList.remove('border-blue-500', 'bg-blue-600/20');
            });

            const activeCard = document.getElementById(`pay-card-${payId}`);
            if (activeCard) activeCard.classList.add('border-blue-500', 'bg-blue-600/20');

            updateOrderSummary();
        }

        function calculateAdminFee(basePrice) {
            if (!basePrice) return 0;
            const setting = APP_STATE.adminFeeSetting;
            if (setting.type === 'percent') {
                return Math.round((basePrice * setting.value) / 100);
            }
            return setting.value;
        }

        function updateOrderSummary() {
            const basePrice = APP_STATE.selectedPackage ? APP_STATE.selectedPackage.price : 0;
            const fee = calculateAdminFee(basePrice);
            const total = basePrice + fee;

            document.getElementById('summary-item-price').innerText = `Rp ${basePrice.toLocaleString('id-ID')}`;
            document.getElementById('summary-admin-fee').innerText = `Rp ${fee.toLocaleString('id-ID')}`;
            document.getElementById('summary-total-price').innerText = `Rp ${total.toLocaleString('id-ID')}`;
        }
