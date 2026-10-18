// Freaze Market - Global App State & Seed Data
// Dipisahkan dari script asli tanpa mengubah logika fitur.

/* ==================== GLOBAL APP STATE & SEED DATA ==================== */
        const APP_STATE = {
            currentUser: null, // Logged in user details
            isAdminLoggedIn: false,
            adminFeeSetting: { type: 'flat', value: 1500 }, // default flat fee Rp 1.500
            adminProfitBalance: 0,
            selectedGame: null,
            selectedPackage: null,
            selectedPayment: null,
            orders: [],
            botLogs: [],
            footerClickCount: 0,
            footerClickTimer: null
        };

        // Game Catalog Dataset with authentic pricing
        const GAME_CATALOG = [
            {
                id: 'roblox',
                name: 'Roblox',
                image: 'https://placehold.co/200x200/0f172a/0066ff?text=ROBLOX',
                desc: 'Top-Up Robux resmi via Username & Login ID akun.',
                type: 'roblox',
                packages: [
                    { id: 'rbx-80', name: '80 Robux', price: 15000 },
                    { id: 'rbx-400', name: '400 Robux', price: 65000 },
                    { id: 'rbx-800', name: '800 Robux', price: 125000 },
                    { id: 'rbx-2000', name: '2.000 Robux', price: 295000 }
                ]
            },
            {
                id: 'freefire',
                name: 'Free Fire',
                image: 'https://placehold.co/200x200/0f172a/ef4444?text=FREE+FIRE',
                desc: 'Proses kilat bot detector otomatis via ID Player.',
                type: 'direct_id',
                packages: [
                    { id: 'ff-50', name: '50 Diamond', price: 8000 },
                    { id: 'ff-140', name: '140 Diamond', price: 20000 },
                    { id: 'ff-355', name: '355 Diamond', price: 50000 },
                    { id: 'ff-720', name: '720 Diamond', price: 100000 }
                ]
            },
            {
                id: 'mlbb',
                name: 'Mobile Legends: Bang Bang',
                image: 'https://placehold.co/200x200/0f172a/3b82f6?text=MLBB',
                desc: 'Top-Up Diamond MLBB fast server 100% legal.',
                type: 'mlbb_id',
                packages: [
                    { id: 'ml-86', name: '86 Diamond', price: 22000 },
                    { id: 'ml-172', name: '172 Diamond', price: 44000 },
                    { id: 'ml-257', name: '257 Diamond', price: 65000 },
                    { id: 'ml-706', name: '706 Diamond', price: 175000 }
                ]
            },
            {
                id: 'valorant',
                name: 'Valorant',
                image: 'https://placehold.co/200x200/0f172a/ef4444?text=VALORANT',
                desc: 'Isi Valorant Points (VP) resmi Riot ID.',
                type: 'riot_id',
                packages: [
                    { id: 'vp-475', name: '475 VP', price: 52000 },
                    { id: 'vp-1000', name: '1.000 VP', price: 105000 },
                    { id: 'vp-2050', name: '2.050 VP', price: 210000 }
                ]
            },
            {
                id: 'pb',
                name: 'Point Blank',
                image: 'https://placehold.co/200x200/0f172a/0066ff?text=POINT+BLANK',
                desc: 'PB Cash Zepetto instan pengiriman cepat.',
                type: 'direct_id',
                packages: [
                    { id: 'pb-1200', name: '1.200 Cash', price: 11000 },
                    { id: 'pb-6000', name: '6.000 Cash', price: 53000 },
                    { id: 'pb-12000', name: '12.000 Cash', price: 104000 }
                ]
            },
            {
                id: 'bloodstrike',
                name: 'Blood Strike',
                image: 'https://placehold.co/200x200/0f172a/eab308?text=BLOOD+STRIKE',
                desc: 'Isi Gold Blood Strike otomatis terpercaya.',
                type: 'direct_id',
                packages: [
                    { id: 'bs-100', name: '100 Gold', price: 14000 },
                    { id: 'bs-500', name: '500 Gold', price: 68000 }
                ]
            },
            {
                id: 'genshin',
                name: 'Genshin Impact',
                image: 'https://placehold.co/200x200/0f172a/a855f7?text=GENSHIN',
                desc: 'Genesis Crystals via User ID & Server.',
                type: 'genshin_id',
                packages: [
                    { id: 'gi-60', name: '60 Genesis Crystals', price: 15000 },
                    { id: 'gi-300', name: '300+30 Genesis Crystals', price: 72000 },
                    { id: 'gi-bless', name: 'Blessing of the Welkin Moon', price: 73000 }
                ]
            },
            {
                id: 'codm',
                name: 'Call of Duty Mobile (CODM)',
                image: 'https://placehold.co/200x200/0f172a/10b981?text=CODM',
                desc: 'Isi CP CODM via OpenID resmi cepat.',
                type: 'direct_id',
                packages: [
                    { id: 'codm-63', name: '63 CP', price: 12000 },
                    { id: 'codm-317', name: '317 CP', price: 58000 },
                    { id: 'codm-634', name: '634 CP', price: 115000 }
                ]
            }
        ];

        // Midtrans Simulated Payment Options
        const PAYMENT_METHODS = [
            { id: 'qris', name: 'QRIS (All E-Wallet / Bank)', icon: 'fa-qrcode', feeNotice: 'Instan Scan' },
            { id: 'bca_va', name: 'BCA Virtual Account', icon: 'fa-building-columns', feeNotice: 'Otomatis' },
            { id: 'mandiri_va', name: 'Mandiri Virtual Account', icon: 'fa-landmark', feeNotice: 'Otomatis' },
            { id: 'gopay', name: 'GoPay', icon: 'fa-wallet', feeNotice: 'Otomatis' },
            { id: 'ovo', name: 'OVO', icon: 'fa-mobile-screen', feeNotice: 'Otomatis' },
            { id: 'dana', name: 'DANA', icon: 'fa-coins', feeNotice: 'Otomatis' }
        ];
