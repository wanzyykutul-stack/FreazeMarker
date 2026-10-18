# Freaze Market — Modular + Supabase

Project ini mempertahankan tampilan utama Freaze Market, memisahkan JavaScript/CSS, dan menambahkan integrasi Supabase untuk autentikasi, profil, pesanan/invoice, role admin, audit log, serta email notification melalui Supabase Edge Function + Resend.

## Struktur

```text
freaze-market-modules/
├── index.html
├── assets/css/style.css
├── modules/
│   ├── state-and-data.js
│   ├── supabase-config.js        # URL + anon/publishable key publik
│   ├── supabase-service.js       # Supabase client, order API, audit, email invocation
│   ├── initialization.js
│   ├── navigation.js
│   ├── admin-access.js
│   ├── admin-authentication.js  # admin ditentukan role DB, bukan passkey hard-coded
│   ├── catalog-and-order.js
│   ├── checkout-and-payment.js
│   ├── invoice.js
│   ├── admin-dashboard.js
│   ├── user-authentication.js
│   └── notifications.js
├── supabase/
│   ├── migrations/202610180001_freaze_market.sql
│   └── functions/send-notification/index.ts
└── README.md
```

## 1. Buat dan konfigurasi Supabase

1. Buat project di <https://supabase.com/>.
2. Buka **Project Settings → API** (atau Connect) dan salin **Project URL** serta **anon/publishable key**.
3. Isi `modules/supabase-config.js`:

```js
window.FREAZE_SUPABASE_CONFIG = {
  url: 'https://PROJECT_ID.supabase.co',
  anonKey: 'YOUR_ANON_OR_PUBLISHABLE_KEY',
  brandName: 'Freaze Market'
};
```

Anon/publishable key memang boleh ada di frontend selama RLS aktif. **Jangan pernah memasukkan `service_role` key ke file frontend, GitHub publik, atau zip yang dibagikan.**

## 2. Buat tabel database

1. Di Supabase Dashboard buka **SQL Editor → New query**.
2. Salin dan jalankan seluruh isi `supabase/migrations/202610180001_freaze_market.sql`.
3. Pastikan tabel `profiles`, `orders`, dan `audit_logs` muncul di Table Editor.

SQL menyiapkan trigger pembuatan profil dari metadata Auth, status pesanan, row-level security, serta audit otomatis untuk pembuatan/perubahan status pesanan. Role pengguna default adalah `user`; user tidak bisa menaikkan rolenya sendiri melalui pembaruan profil biasa.

## 3. Aktifkan login Google

1. Di Google Cloud Console buat OAuth Client ID untuk aplikasi Web.
2. Di Supabase buka **Authentication → Providers → Google**, aktifkan provider dan masukkan Client ID serta Client Secret dari Google.
3. Tambahkan callback URL yang ditampilkan Supabase ke daftar **Authorized redirect URIs** pada Google Cloud.
4. Di Supabase **Authentication → URL Configuration**, set Site URL ke URL website yang akan dipakai dan masukkan URL lokal/deployment ke Redirect URLs, misalnya `http://localhost:5500/**` dan domain produksi.
5. Tes tombol **Lanjutkan dengan Google**. Untuk website produksi gunakan HTTPS.

Google OAuth tidak memerlukan dan tidak boleh meminta kata sandi Gmail pengguna di formulir Freaze Market. Google mengurus autentikasi, Supabase menerima sesi yang tervalidasi.

## 4. Buat akun admin pertama

1. Daftar akun normal melalui website dengan email yang kamu miliki dan konfirmasi email jika diminta.
2. Di Supabase **SQL Editor**, jalankan query berikut dengan email admin yang benar:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('EMAIL_ADMIN_KAMU');
```

3. Login kembali dengan akun itu. Akses panel admin akan dicek melalui `profiles.role`. Jangan menjadikan URL rahasia atau passkey di browser sebagai sistem keamanan admin.

## 5. Email notifikasi login dan invoice

Email dikirim oleh Edge Function, bukan langsung dari browser. Contoh ini memakai Resend:

1. Buat akun di <https://resend.com/> dan verifikasi domain/pengirim sesuai instruksi Resend.
2. Instal Supabase CLI dan login, lalu dari folder project jalankan:

```bash
supabase login
supabase link --project-ref PROJECT_REF
supabase functions deploy send-notification
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="Freaze Market <notifikasi@domainmu.com>" ADMIN_NOTIFICATION_EMAIL=admin@domainmu.com
```

`SUPABASE_URL` dan `SUPABASE_ANON_KEY` biasanya tersedia otomatis sebagai environment Edge Functions. Jika lingkungan project kamu tidak menyediakannya, set keduanya melalui secrets dengan nilai dari Supabase. Jangan set `service_role` di frontend.

Edge Function mendukung notifikasi login, pesanan baru, dan perubahan status. Email login dikirim ke email akun; pesanan baru juga memberi notifikasi admin jika `ADMIN_NOTIFICATION_EMAIL` diatur. Perubahan status dapat memberi notifikasi kepada pemilik pesanan dan admin.

## 6. Cara menjalankan website

Jangan membuka `index.html` lewat `file://` jika OAuth dipakai. Jalankan server lokal, misalnya:

```bash
python -m http.server 5500
```

Kemudian buka <http://localhost:5500> dan tambahkan URL ini ke Supabase Redirect URLs. Tailwind, Supabase JS, Font Awesome, dan font masih memakai CDN sehingga perlu koneksi internet.

## 7. Alur dan batasan saat ini

- Daftar akun: nama lengkap, username, tanggal lahir, email, kata sandi, konfirmasi kata sandi.
- Login email/password dan Google OAuth melalui Supabase Auth.
- Profil dan pesanan tersimpan di PostgreSQL; riwayat hanya terlihat pemilik pesanan dan admin.
- Invoice punya status `pending`, `success`, `failed`, `cancelled`, atau `refund`.
- Admin harus terautentikasi dan memiliki role `admin` untuk mengubah status.
- Log perubahan status order dicatat oleh trigger database. Login dan aktivitas frontend juga mengirim event audit.
- Verifikasi pembayaran masih manual oleh admin. **Tidak ada payment gateway aktif** dalam versi ini; status `success` berarti admin telah menandai pesanan berhasil.
- Integrasi top-up game ke supplier masih tidak otomatis. Konfirmasi pembayaran/top-up harus benar-benar diperiksa sebelum menandai pesanan `success`.
- Browser frontend menghitung harga dari katalog. Sebelum menerima transaksi sungguhan, pindahkan validasi harga/fee ke server atau database function tepercaya agar klien tidak dapat mengirim nominal yang dimanipulasi.
- Audit event yang dikirim dari browser bukan bukti forensik yang sempurna; event status order dari trigger database lebih tepercaya.

## Troubleshooting

- **Supabase belum dikonfigurasi:** pastikan URL dan anon key di `modules/supabase-config.js` sudah diganti dari placeholder.
- **Email konfirmasi tidak masuk:** cek Authentication → Email Templates/SMTP dan folder spam. Untuk produksi, set SMTP kustom di Supabase Auth.
- **Google login gagal:** cek provider Google, Client ID/Secret, callback URL Supabase, dan Redirect URLs.
- **Tidak bisa masuk admin:** jalankan query promosi admin untuk akun yang sudah terdaftar, lalu login ulang.
- **Email notifikasi tidak terkirim:** periksa deployment Edge Function, secrets Resend, domain pengirim, dan log function di Supabase.

## Catatan

Saya sudah menambahkan kode dan skema integrasi, tetapi tidak dapat mengaktifkan project Supabase, Google OAuth, domain pengirim, atau menguji email sungguhan tanpa kredensial/project milikmu. Konfigurasi langkah di atas wajib dilakukan sebelum fitur backend aktif.
