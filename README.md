# Sistem Pembayaran Santri PPMH Silir Sari

Sistem informasi pembayaran bulanan santri berbasis web (Next.js) dan backend modern (Supabase). Dirancang untuk orang tua santri agar dapat melakukan pembayaran dari rumah dengan mudah.

## Fitur Utama
- **Login NISN**: Masuk menggunakan NISN santri.
- **Modern UI**: Desain premium dengan Glassmorphism dan Dark Mode.
- **Mobile Friendly**: Responsif dan mendukung PWA (Installable di Android/iOS).
- **Verifikasi Online**: Upload bukti transfer dan verifikasi oleh Admin/Bendahara.
- **Statistik Realtime**: Dashboard statistik untuk pimpinan dan admin.

## Teknologi
- **Frontend**: Next.js 14+ (React), Tailwind CSS, Framer Motion.
- **Backend**: Supabase (Auth, Database, Storage).
- **Mobile**: Progressive Web App (PWA) / Support WebView.

## Langkah Instalasi & Deploy

### 1. Setup Supabase
- Buat project baru di [Supabase](https://supabase.com).
- Buka SQL Editor dan jalankan isi dari file `schema.sql`.
- Di menu **Storage**, buat bucket baru bernama `payment-proofs` dan set ke **Public**.
- Ambil `URL` dan `Anon Key` dari menu **Project Settings > API**.

### 2. Konfigurasi Environment
- Buat file `.env.local` di root project:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=link_supabase_anda
  NEXT_PUBLIC_SUPABASE_ANON_KEY=key_anon_anda
  ```

### 3. Deploy ke Vercel
- Push code ke GitHub.
- Hubungkan repository ke [Vercel](https://vercel.com).
- Masukkan Environment Variables di dashboard Vercel.
- Klik **Deploy**.

### 4. Build Menjadi Aplikasi Android
Aplikasi ini sudah mendukung PWA. Untuk menjadikannya aplikasi Android (.apk):
- **Opsi A (PWA)**: Buka website di Chrome Android > Klik Titik Tiga > **Install App / Tambahkan ke Layar Utama**.
- **Opsi B (WebView - Android Studio)**:
  1. Buat project baru di Android Studio dengan template Empty Activity.
  2. Gunakan `WebView` untuk memuat URL Vercel aplikasi Anda.
  3. Pastikan `JavaScriptEnabled = true` dan hubungkan `WebViewClient`.

## Struktur Project
- `/src/app`: Routing dan Halaman (App Router).
- `/src/components`: Komponen UI reusable.
- `/src/lib`: Konfigurasi Supabase dan Utils.
- `/public`: Aset gambar dan manifest PWA.
