# Perancangan Sistem SPP PPMH

Sistem Informasi Pembayaran (SPP) Pondok Pesantren Minhajush Sholihin (PPMH) adalah platform berbasis web (Progressive Web App - PWA) yang dirancang untuk mendigitalisasi proses penagihan, pembayaran, dan manajemen keuangan pesantren.

## 1. Arsitektur Sistem

Arsitektur sistem ini dibangun menggunakan pola modern *Serverless* yang mengutamakan kecepatan pengembangan dan skalabilitas.

- **Frontend (Next.js 14+)**: Menggunakan *App Router* untuk performa maksimal dan optimasi SEO.
- **Backend (Supabase)**: Database PostgreSQL, autentikasi, dan storage bukti bayar.
- **Firebase Messaging**: Pengiriman notifikasi push ke perangkat wali santri.

```mermaid
graph TD
    Client[Browser / PWA] <--> NextJS[Next.js App Router]
    NextJS <--> SupabaseAuth[Supabase Auth]
    NextJS <--> SupabaseDB[Supabase PostgreSQL]
    NextJS <--> SupabaseStorage[Supabase Storage]
    NextJS --> Firebase[Firebase Cloud Messaging]
    Firebase --> Notification[Push Notification to Parent]
```

*Gambar 1: Alur komunikasi antar komponen sistem.*

## 2. Use Case Diagram (System Boundary - High Contrast)

Diagram ini menggunakan tema **Dark Mode** (Non-Putih) untuk kejelasan visual maksimal dan estetika premium.

```mermaid
graph LR
    %% Definisi Aktor
    Admin((Admin))
    Wali((Wali Santri))

    subgraph Boundary [Sistem Informasi SPP PPMH]
        direction TB
        %% Use Cases
        UC1([Kelola Data Santri])
        UC2([Buat Tagihan SPP])
        UC3([Verifikasi Pembayaran])
        UC4([Kirim Pengumuman])
        UC5([Lihat Dashboard & Statistik])
        UC6([Pengaturan Sistem])
        UC7([Lihat Riwayat Tagihan])
        UC8([Upload Bukti Transfer])
        UC9([Donasi Sukarela])
        UC10([Terima Notifikasi Push])
    end

    %% Hubungan Admin
    Admin --- UC1
    Admin --- UC2
    Admin --- UC3
    Admin --- UC4
    Admin --- UC5
    Admin --- UC6

    %% Hubungan Wali Santri
    Wali --- UC5
    Wali --- UC7
    Wali --- UC8
    Wali --- UC9
    Wali --- UC10

    %% Styling Kontras Tinggi (Anti-Putih)
    style Boundary fill:#1e293b,stroke:#f8fafc,stroke-width:2px,stroke-dasharray: 5 5,color:#fff
    style Admin fill:#2563eb,stroke:#dbeafe,stroke-width:2px,color:#fff
    style Wali fill:#059669,stroke:#dcfce7,stroke-width:2px,color:#fff
    
    style UC1 fill:#475569,stroke:#94a3b8,color:#fff
    style UC2 fill:#475569,stroke:#94a3b8,color:#fff
    style UC3 fill:#475569,stroke:#94a3b8,color:#fff
    style UC4 fill:#475569,stroke:#94a3b8,color:#fff
    style UC5 fill:#475569,stroke:#94a3b8,color:#fff
    style UC6 fill:#475569,stroke:#94a3b8,color:#fff
    style UC7 fill:#475569,stroke:#94a3b8,color:#fff
    style UC8 fill:#475569,stroke:#94a3b8,color:#fff
    style UC9 fill:#475569,stroke:#94a3b8,color:#fff
    style UC10 fill:#475569,stroke:#94a3b8,color:#fff
```

## 3. Desain Antarmuka (Interface Design)

Sistem SPP PPMH mengadopsi prinsip desain modern dengan estetika premium yang fokus pada kegunaan (*usability*) dan kenyamanan visual.

### 3.1 Tema dan Estetika
- **Dark Mode Architecture**: Seluruh antarmuka menggunakan palet warna gelap (Deep Navy/Slate) untuk mengurangi kelelahan mata.
- **Glassmorphism**: Komponen kartu (cards) menggunakan efek transparansi dengan *backdrop-blur* untuk memberikan kesan kedalaman dan modernitas.
- **Aksen Warna**: 
    - **Emerald (#10b981)**: Digunakan untuk status 'Lunas' dan tombol konfirmasi.
    - **Sky Blue (#0ea5e9)**: Digunakan untuk navigasi dan elemen branding.
    - **Rose (#f43f5e)**: Digunakan untuk peringatan tagihan tertunggak atau status 'Ditolak'.

### 3.2 Komponen Utama Antarmuka

#### A. Dashboard Admin
- **Statistik Header**: Menampilkan ringkasan total pendapatan bulan berjalan dan sisa tagihan dalam bentuk kartu glassmorphism.
- **Tabel Verifikasi**: Daftar bukti pembayaran yang masuk dengan preview gambar mini (thumbnail).

#### B. Portal Wali Santri (Mobile First)
- **Ringkasan Tagihan**: Menampilkan total tagihan yang harus dibayar di bagian paling atas dengan warna kontras (Amber).
- **History List**: Daftar riwayat pembayaran dalam bentuk *timeline*.

### 3.3 Visual Mockup (Konsep)

![Dashboard Admin Mockup](file:///C:/Users/abdul/.gemini/antigravity/brain/77138378-9bf8-4934-8071-12c326a87e73/admin_dashboard_mockup_1777474742569.png)
*Gambar 3.1: Konsep visual dashboard admin dengan tema Dark Mode.*

---

## 4. Activity Diagram (Alur Pembayaran)

```mermaid
graph TD
    A[Mulai] --> B[Wali Santri melihat daftar tagihan]
    B --> C[Pilih tagihan yang akan dibayar]
    C --> D[Transfer ke rekening yang ditentukan]
    D --> E[Upload bukti transfer]
    E --> F[Status berubah menjadi 'Pending']
    F --> G{Admin Verifikasi?}
    G -- Valid --> H[Admin menyetujui pembayaran]
    G -- Tidak Valid --> I[Admin menolak pembayaran]
    H --> J[Status 'Paid' & Kirim Notifikasi Push]
    I --> K[Status 'Rejected' & Kirim Notifikasi Push]
    J --> L[Selesai]
    K --> L
```

## 5. Class Diagram (Diagram Kelas)

```mermaid
classDiagram
    class Profil {
        +UUID id_profil
        +String nama_lengkap
        +String peran
        +String nisn_wali
    }

    class Santri {
        +UUID id_santri
        +String nama_santri
        +String nisn
        +String jenjang
    }

    class Pembayaran {
        +UUID id_pembayaran
        +UUID id_santri
        +String status
        +String tautan_bukti
    }

    Profil "1" -- "0..*" Santri : mengasuh
    Santri "1" -- "0..*" Pembayaran : memiliki
    Profil "1" -- "0..*" Pembayaran : memverifikasi
```

---
**Dokumentasi ini dibuat berdasarkan struktur kode aktif di repository `spp-ppmh-silirsari`.**
