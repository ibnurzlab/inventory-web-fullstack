# GudangFlow — Sistem Manajemen Inventory Gudang

Aplikasi manajemen inventory gudang berbasis web (full-stack) untuk mencatat barang,
transaksi stok masuk/keluar, memantau stok menipis, dan membuat laporan (Excel & PDF)
secara real-time.

Aplikasi ini dikembangkan dari demo front-end menjadi **aplikasi full-stack** dengan
backend Express, database SQLite, dan autentikasi berbasis peran (role).

---

## ✨ Fitur Utama

- **Autentikasi & Role** — login dengan JWT, dua peran: `ADMIN` dan `STAFF`.
- **Manajemen Barang** — tambah, ubah, hapus, cari, dan filter barang.
- **Stok Masuk & Keluar** — pencatatan transaksi dengan validasi stok otomatis.
- **Riwayat Transaksi** — filter berdasarkan jenis, tanggal, dan kata kunci.
- **Laporan & Grafik Analitik** — ringkasan, tren 14 hari, barang terlaris,
  distribusi kategori, dan daftar stok menipis (grafik interaktif).
- **Import / Export Excel** — unduh template, import data barang massal,
  export daftar barang dan riwayat transaksi ke `.xlsx`.
- **Cetak PDF** — surat jalan per transaksi (nota) dan laporan transaksi periode.
- **Manajemen Pengguna** — kelola akun dan peran (khusus `ADMIN`).

---

## 🧱 Teknologi

| Lapisan    | Teknologi                                                        |
| ---------- | ---------------------------------------------------------------- |
| Front-end  | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 7      |
| Grafik     | Recharts                                                          |
| Ikon       | lucide-react                                                      |
| Back-end   | Node.js, Express 4, TypeScript (dijalankan via `tsx`)             |
| Database   | SQLite via Prisma ORM 7 + `better-sqlite3`                        |
| Auth       | JSON Web Token (`jsonwebtoken`) + `bcryptjs`                      |
| Excel/PDF  | ExcelJS, PDFKit                                                   |
| Validasi   | Zod                                                               |

---

## 📋 Prasyarat

- **Node.js 20+** (disarankan 22)
- **npm** (proyek ini memakai `package-lock.json`)

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
copy .env.example .env        # Windows (PowerShell)
# cp .env.example .env        # macOS / Linux

# 3. Buat tabel database & isi data contoh
npm run db:push
npm run db:seed

# 4. Jalankan front-end + back-end sekaligus
npm run dev
```

Setelah berjalan:

- Front-end: <http://localhost:3000>
- REST API: <http://localhost:3001/api>

> Untuk mode produksi: `npm run build` lalu `npm start`
> (Express akan menyajikan hasil build `dist/` sekaligus API di port yang sama).

---

## 🔑 Akun Demo

Angka ini dibuat oleh `npm run db:seed`.

| Peran   | Username | Password    |
| ------- | -------- | ----------- |
| Admin   | `admin`  | `admin123`  |
| Staff   | `staff`  | `staff123`  |

> **Penting:** segera ganti password akun demo sebelum dipakai di produksi.

---

## 🔐 Hak Akses

| Aksi                                        | ADMIN | STAFF |
| ------------------------------------------- | :---: | :---: |
| Melihat dashboard, barang, riwayat, laporan |  ✅   |  ✅   |
| Mencatat stok masuk / keluar                |  ✅   |  ✅   |
| Export Excel & cetak PDF                    |  ✅   |  ✅   |
| Tambah / ubah / hapus barang                |  ✅   |  ❌   |
| Import barang dari Excel                    |  ✅   |  ❌   |
| Kelola pengguna                             |  ✅   |  ❌   |

---

## 📜 Skrip npm

| Perintah            | Fungsi                                                  |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Jalankan API + web dev server sekaligus (concurrently)  |
| `npm run dev:api`   | Jalankan hanya REST API (port 3001)                     |
| `npm run dev:web`   | Jalankan hanya Vite dev server (port 3000)              |
| `npm run build`     | Build front-end ke `dist/`                              |
| `npm start`         | Jalankan server produksi (menyajikan `dist/` + API)     |
| `npm run db:push`   | Terapkan schema Prisma ke SQLite                        |
| `npm run db:seed`   | Isi data contoh (user + barang + transaksi)             |
| `npm run db:reset`  | Reset database lalu seed ulang                          |
| `npm run db:studio` | Buka Prisma Studio                                      |
| `npm run lint`      | Cek tipe TypeScript (`tsc --noEmit`)                    |

---

## ⚙️ Variabel Environment

Lihat `.env.example`. Variabel yang dikenali:

| Variabel          | Default                     | Keterangan                                   |
| ----------------- | --------------------------- | -------------------------------------------- |
| `DATABASE_URL`    | `file:./prisma/dev.db`      | Lokasi file SQLite                           |
| `JWT_SECRET`      | _(contoh)_                  | Kunci rahasia JWT — **wajib diganti**        |
| `JWT_EXPIRES_IN`  | `7d`                        | Masa berlaku token                           |
| `API_PORT`        | `3001`                      | Port REST API                                |
| `COMPANY_NAME`    | `GudangFlow Warehouse`      | Nama pada header PDF                         |
| `COMPANY_ADDRESS` | `Jl. Industri Raya No. 1…`  | Alamat pada header PDF                       |
| `COMPANY_PHONE`   | `(021) 5550-1234`           | Telepon pada header PDF                      |

> File `.env`, database `prisma/*.db`, dan folder `server/generated/` sudah masuk
> `.gitignore`.

---

## 🗂️ Struktur Proyek

```
.
├── prisma/
│   ├── schema.prisma        # Model User, Item, Transaction
│   └── seed.ts              # Data contoh
├── prisma.config.ts         # Konfigurasi Prisma CLI (v7+)
├── server/
│   ├── index.ts             # Entry Express (static + API)
│   ├── lib/                 # prisma, auth, http, validate, excel, pdf
│   └── routes/              # auth, items, transactions, reports
└── src/
    ├── components/          # layout, items, ui
    ├── context/             # AuthContext, InventoryContext
    ├── lib/                 # api.ts, format.ts
    ├── pages/               # Dashboard, Items, Stock, History, Reports, Users, Profile
    └── types/               # Tipe data bersama
```

---

## 🔌 Ringkasan REST API

Semua endpoint (kecuali login) memerlukan header
`Authorization: Bearer <token>`.

| Method | Endpoint                        | Keterangan                          |
| ------ | ------------------------------- | ----------------------------------- |
| POST   | `/api/auth/login`               | Login, mengembalikan token          |
| GET    | `/api/auth/me`                  | Profil user aktif                   |
| POST   | `/api/auth/change-password`     | Ganti password                      |
| GET    | `/api/auth/users`               | Daftar user (ADMIN)                 |
| POST   | `/api/auth/users`               | Tambah user (ADMIN)                 |
| PUT    | `/api/auth/users/:id`           | Ubah user (ADMIN)                   |
| DELETE | `/api/auth/users/:id`           | Hapus user (ADMIN)                  |
| GET    | `/api/items`                    | Daftar barang                       |
| GET    | `/api/items/categories`         | Daftar kategori                     |
| POST   | `/api/items`                    | Tambah barang (ADMIN)               |
| PUT    | `/api/items/:id`                | Ubah barang (ADMIN)                 |
| DELETE | `/api/items/:id`                | Hapus barang (ADMIN)                |
| GET    | `/api/items/template`           | Unduh template import (.xlsx)       |
| GET    | `/api/items/export`             | Export barang (.xlsx)               |
| POST   | `/api/items/import`             | Import barang dari Excel            |
| GET    | `/api/transactions`             | Riwayat transaksi                   |
| POST   | `/api/transactions`             | Catat transaksi stok                |
| GET    | `/api/transactions/export`      | Export riwayat (.xlsx)              |
| GET    | `/api/transactions/report.pdf`  | Cetak laporan periode (PDF)         |
| GET    | `/api/transactions/:id/nota.pdf`| Cetak surat jalan / nota (PDF)      |
| GET    | `/api/reports/summary`          | Ringkasan stok & transaksi          |
| GET    | `/api/reports/trend`            | Tren transaksi harian               |
| GET    | `/api/reports/top-items`        | Barang terlaris                     |
| GET    | `/api/reports/categories`       | Distribusi per kategori             |
| GET    | `/api/reports/low-stock`        | Daftar stok menipis                 |

---

## 📝 Catatan Teknis

- **Prisma 7** tidak lagi menerima `url` di `schema.prisma`; URL database
  dikonfigurasi di `prisma.config.ts` dan runtime memakai driver adapter
  `@prisma/adapter-better-sqlite3`.
- Import Excel dikirim sebagai **JSON base64** (`{ "dataBase64": "..." }`)
  sehingga tidak memerlukan middleware upload file.
- Halaman **Laporan** dimuat terpisah (lazy) karena memuat library grafik,
  sehingga bundle awal tetap ringan.

---

## 📄 Lisensi

Proyek ini bebas digunakan dan dikembangkan lebih lanjut.
