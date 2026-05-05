# Dokumentasi Lengkap Perancangan Sistem SPP PPMH

Dokumen ini berisi perancangan teknis menyeluruh untuk Sistem Informasi Pembayaran (SPP) Pondok Pesantren Minhajush Sholihin (PPMH). Sistem ini dirancang untuk mendigitalisasi proses keuangan dengan arsitektur modern berbasis PWA.

---

## 1. Arsitektur Sistem (Overview)
Sistem dibangun menggunakan stack teknologi **Next.js 14**, **Supabase**, dan **Firebase Cloud Messaging**.

```mermaid
graph TD
    Client[PWA Client] <--> Server[Next.js App Router]
    Server <--> Auth[Supabase Auth]
    Server <--> DB[PostgreSQL Database]
    Server <--> Storage[Supabase Storage]
    Server --> Push[Firebase Messaging]
```

---

## 2. Use Case Diagram (System Boundary)
Mendefinisikan interaksi antara pengguna (Admin & Wali Santri) dengan fungsi-fungsi utama sistem.

```mermaid
graph LR
    Admin((Admin))
    Wali((Wali Santri))

    subgraph Boundary [Sistem SPP PPMH]
        direction TB
        UC1([Kelola Data Santri])
        UC2([Buat Tagihan Bulanan])
        UC3([Verifikasi Pembayaran])
        UC4([Kirim Pengumuman])
        UC5([Lihat Dashboard & Statistik])
        UC6([Lihat Daftar Tagihan])
        UC7([Upload Bukti Transfer])
        UC8([Donasi Sukarela])
        UC9([Terima Notifikasi])
        UC10([Pengaturan Akun])
    end

    %% Hubungan Admin
    Admin --- UC1
    Admin --- UC2
    Admin --- UC3
    Admin --- UC4
    Admin --- UC5
    Admin --- UC10

    %% Hubungan Wali Santri
    Wali --- UC5
    Wali --- UC6
    Wali --- UC7
    Wali --- UC8
    Wali --- UC9
    Wali --- UC10

    %% Styling Kontras Tinggi
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

---

## 3. Flowchart (Alur Logika Pembayaran)
Menunjukkan logika alur kerja dari sisi teknis sistem.

```mermaid
flowchart TD
    Start([Mulai]) --> Login{Login Berhasil?}
    Login -- Tidak --> Start
    Login -- Ya --> CheckBill[Cek Daftar Tagihan]
    
    CheckBill --> Status{Status Tagihan?}
    Status -- Lunas --> Done([Selesai])
    Status -- Belum Bayar --> Pay[Transfer ke Rekening]
    
    Pay --> Upload[Upload Bukti Transfer]
    Upload --> Pending[Status: Pending]
    
    Pending --> Verify{Admin Validasi?}
    Verify -- Tidak Valid --> Reject[Status: Ditolak]
    Reject --> Upload
    
    Verify -- Valid --> Paid[Status: Lunas]
    Paid --> PushNotif[Kirim Notifikasi Push]
    PushNotif --> Done

    %% Styling
    style Start fill:#334155,color:#fff
    style Done fill:#334155,color:#fff
    style Login fill:#1e293b,stroke:#2563eb,color:#fff
    style Verify fill:#1e293b,stroke:#059669,color:#fff
```

---

## 4. Activity Diagram (Proses Bisnis)
Menggambarkan aktivitas berurutan antara Wali Santri dan Admin.

```mermaid
graph TD
    subgraph Wali_Santri [Wali Santri]
        A1[Lihat Tagihan] --> A2[Transfer Dana]
        A2 --> A3[Upload Bukti]
        A3 --> A4[Terima Notifikasi]
    end

    subgraph Admin_System [Admin & Sistem]
        B1[Terima Bukti] --> B2{Verifikasi?}
        B2 -- Valid --> B3[Update Status: Lunas]
        B2 -- Gagal --> B4[Update Status: Ditolak]
        B3 --> B5[Kirim Notif Push]
        B4 --> B5
    end

    A3 -.-> B1
    B5 -.-> A4

    %% Styling
    style Wali_Santri fill:#ecfdf5,stroke:#059669
    style Admin_System fill:#eff6ff,stroke:#2563eb
```

---

## 5. Class Diagram (Struktur Data)
Menjelaskan relasi antar tabel dalam database Supabase.

```mermaid
classDiagram
    class Profiles {
        +UUID id
        +String full_name
        +Enum role
        +String nisn
    }
    class Students {
        +UUID id
        +String name
        +String nisn
        +String jenjang
        +UUID parent_id
    }
    class Payments {
        +UUID id
        +UUID student_id
        +Int month
        +Int year
        +String status
        +String proof_url
    }
    class Announcements {
        +UUID id
        +String title
        +String content
        +Boolean is_active
    }

    Profiles "1" -- "0..*" Students : parent_of
    Students "1" -- "0..*" Payments : has
    Profiles "1" -- "0..*" Payments : verifies
    Profiles "1" -- "0..*" Announcements : creates

    %% Styling
    style Profiles fill:#dbeafe,stroke:#2563eb
    style Students fill:#dcfce7,stroke:#059669
    style Payments fill:#fef3c7,stroke:#d97706
```

---

## 6. Sequence Diagram (Verifikasi Pembayaran)
Menunjukkan urutan pertukaran pesan antar komponen saat verifikasi.

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin
    participant S as Sistem (Next.js)
    participant D as Database (Supabase)
    participant F as Firebase (Push)

    A->>S: Klik Konfirmasi Pembayaran
    S->>D: Update status='paid' & verified_at=NOW()
    D-->>S: Konfirmasi Berhasil
    S->>F: Kirim Sinyal Notifikasi
    F-->>S: Notifikasi Terkirim ke Wali
    S-->>A: Tampilkan Pesan Sukses
```

---

## 7. Desain Antarmuka (Interface Design)

### 7.1 Filosofi Desain
*   **Dark Mode**: Mengurangi ketegangan mata dan memberikan kesan premium.
*   **Glassmorphism**: Memberikan kedalaman visual melalui efek transparansi.
*   **Mobile-First**: Optimal untuk diakses melalui smartphone wali santri.

### 7.2 Palet Warna & Tipografi
*   **Warna Utama**: Deep Navy (`#0f172a`), Emerald Green (`#10b981`), Sky Blue (`#0ea5e9`).
*   **Font**: Inter / Roboto (Sans Serif) untuk keterbacaan tinggi.

### 7.3 Konsep Visual (Mockup)

![Dashboard Admin Mockup](file:///C:/Users/abdul/.gemini/antigravity/brain/77138378-9bf8-4934-8071-12c326a87e73/admin_dashboard_mockup_1777474742569.png)
*Gambar 7.1: Konsep Dashboard Admin dengan tema Dark Mode & Glassmorphism.*

---

## 8. Kamus Data (Data Dictionary)

Berikut adalah detail teknis dari struktur tabel utama di Supabase:

### 8.1 Tabel: `profiles`
| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID unik dari Supabase Auth. |
| `full_name` | Text | Nama lengkap pengguna. |
| `role` | Enum | Peran pengguna: `admin`, `parent`. |
| `nisn` | Text (Unique) | NISN santri (khusus untuk role parent). |

### 8.2 Tabel: `students`
| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID unik santri. |
| `name` | Text | Nama santri. |
| `nisn` | Text (Unique) | Nomor Induk Siswa Nasional. |
| `jenjang` | Enum | `sd_mi`, `smp_mts`, `sma_ma`, `kuliah`. |
| `parent_id` | UUID (FK) | Relasi ke tabel `profiles`. |

### 8.3 Tabel: `payments`
| Kolom | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ID unik transaksi. |
| `student_id` | UUID (FK) | Relasi ke tabel `students`. |
| `month` | Integer | Bulan tagihan (1-12). |
| `year` | Integer | Tahun tagihan. |
| `status` | Enum | `unpaid`, `pending`, `paid`, `rejected`. |
| `proof_url` | Text | Link ke file bukti bayar di Storage. |

---

## 9. Panduan Deployment & Konfigurasi

Sistem ini dirancang untuk di-deploy dengan mudah menggunakan integrasi CI/CD.

### 9.1 Environment Variables
Pastikan variabel berikut dikonfigurasi di Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`: URL API Supabase Anda.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key untuk akses publik.
- `SUPABASE_SERVICE_ROLE_KEY`: Key admin untuk operasi backend.
- `FIREBASE_SERVER_KEY`: Khusus untuk integrasi notifikasi push.

### 9.2 Keamanan (Row Level Security)
Database menggunakan kebijakan RLS untuk memastikan:
1. **Admin**: Memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE) ke semua tabel.
2. **Wali Santri**: Hanya bisa melihat data santri dan tagihan yang sesuai dengan NISN mereka.
3. **Publik**: Tidak memiliki akses ke data sensitif.

---
**Dokumentasi ini dibuat untuk proyek SPP PPMH Silir Sari.**
