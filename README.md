# Dot-ID — API Manajemen Permintaan & Persetujuan

Backend API untuk aplikasi manajemen **permintaan** (request) dan **persetujuan** (approval) berbasis role. Pengguna dengan role **CREATOR** mengajukan permintaan; pengguna **APPROVER** menyetujui atau menolak. Dibangun dengan NestJS, Prisma, dan MariaDB/MySQL.

---

## Daftar Isi

- [Dot-ID — API Manajemen Permintaan \& Persetujuan](#dot-id--api-manajemen-permintaan--persetujuan)
  - [Daftar Isi](#daftar-isi)
  - [Tentang Aplikasi](#tentang-aplikasi)
  - [Fitur](#fitur)
  - [Stack Teknologi](#stack-teknologi)
  - [Prasyarat](#prasyarat)
  - [Instalasi \& Menjalankan](#instalasi--menjalankan)
  - [Variabel Lingkungan](#variabel-lingkungan)
  - [Struktur Proyek](#struktur-proyek)
  - [Arsitektur: Layered \& Repository Pattern](#arsitektur-layered--repository-pattern)
    - [Apa yang dipakai](#apa-yang-dipakai)
    - [Keuntungan untuk proyek ini](#keuntungan-untuk-proyek-ini)
    - [Kerugian / trade-off untuk proyek ini](#kerugian--trade-off-untuk-proyek-ini)
    - [Kesimpulan](#kesimpulan)
  - [API \& Dokumentasi](#api--dokumentasi)
  - [Basis Data](#basis-data)
  - [Testing](#testing)
  - [Skrip NPM](#skrip-npm)

---

## Tentang Aplikasi

Aplikasi ini menyediakan **REST API** untuk alur kerja permintaan–persetujuan:

1. **Pengguna** mendaftar dengan role **CREATOR** atau **APPROVER**.
2. **CREATOR** membuat permintaan (judul, deskripsi) dengan status awal **PENDING**.
3. **CREATOR** dapat mengubah permintaan milik sendiri selama masih **PENDING**.
4. **APPROVER** melihat daftar permintaan (semua), lalu memutuskan **APPROVED** atau **REJECTED** per permintaan; tidak boleh memutus permintaan yang dia sendiri buat.
5. Setelah diputus, permintaan tidak bisa diedit; riwayat keputusan (approver, catatan, waktu) dapat dilihat per permintaan.

Autentikasi memakai **JWT**; endpoint dilindungi dengan guard dan pembatasan berdasarkan role. Response API seragam: `{ data, success, message }`.

---

## Fitur

- **Autentikasi:** login (email + password) → token JWT; endpoint terlindungi Bearer JWT.
- **Pengguna:** registrasi (CREATOR/APPROVER), profil saya (`GET /users/me`).
- **Permintaan:** buat, daftar (filter status, paginasi), detail, ubah (hanya CREATOR, hanya PENDING).
- **Persetujuan:** putuskan permintaan (APPROVED/REJECTED) + catatan; lihat riwayat persetujuan per permintaan.
- **Validasi:** DTO dengan class-validator; response seragam; logging request.
- **Dokumentasi API:** Swagger/OpenAPI (UI di `/api`, definisi di `swagger.yml`).
- **Testing:** E2E untuk seluruh alur (auth, users, requests, approvals).

---

## Stack Teknologi

| Lapisan        | Teknologi |
|----------------|-----------|
| Runtime        | Node.js |
| Framework      | NestJS 11 |
| Bahasa         | TypeScript 5.x |
| ORM / DB       | Prisma 7, adapter MariaDB (MySQL) |
| Autentikasi    | Passport JWT, bcryptjs |
| Validasi       | class-validator, class-transformer |
| Dokumentasi API| Swagger (OpenAPI 3) |
| Testing        | Jest, Supertest (E2E) |

---

## Prasyarat

- **Node.js** ≥ 18 (disarankan LTS)
- **pnpm** (atau npm/yarn)
- **MariaDB** atau **MySQL** (untuk database)
- **Git**

---

## Instalasi & Menjalankan

```bash
git clone <url-repo>
cd dot-id

pnpm install

pnpm prisma generate
pnpm prisma migrate deploy

pnpm run db:seed

pnpm run start:dev
```

Server berjalan di **http://localhost:3000** (atau nilai `PORT` di `.env`). Prefix API: **`/api/v1`**. Dokumentasi interaktif (Swagger): **http://localhost:3000/api/v1/docs**.

---

## Variabel Lingkungan

Buat file `.env` di root proyek. Variabel yang dipakai:

| Variabel | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | Connection string Prisma (MySQL) | `mysql://user:pass@localhost:3306/nama_db` |
| `DATABASE_HOST` | Host DB (untuk adapter MariaDB) | `localhost` |
| `DATABASE_PORT` | Port DB | `3306` |
| `DATABASE_USER` | User DB | `root` |
| `DATABASE_PASSWORD` | Password DB | `***` |
| `DATABASE_NAME` | Nama database | `db_test` |
| `JWT_SECRET` | Secret untuk tanda-tangan JWT | string acak yang aman |
| `PORT` | Port HTTP server (opsional) | `3000` |

Untuk development lokal, bisa menambahkan `.env.example` (tanpa nilai rahasia) dan mengabaikan `.env` di Git.

---

## Struktur Proyek

```
dot-id/
├── prisma/
│   ├── schema.prisma      # Model & migrasi
│   ├── seed.ts            # Seed akun CREATOR & APPROVER
│   └── migrations/
├── src/
│   ├── main.ts            # Bootstrap, prefix, ValidationPipe, Swagger
│   ├── app.module.ts      # Modul utama, interceptor global
│   ├── common/            # Kode bersama
│   │   ├── decorators/    # @Roles, dll.
│   │   ├── dto/           # PaginationQueryDto, dll.
│   │   ├── guards/        # JwtAuthGuard, RolesGuard
│   │   └── interceptors/ # TransformResponse, Logging
│   ├── prisma/            # PrismaService (adapter MariaDB)
│   └── modules/
│       ├── auth/          # Login, JWT
│       ├── users/         # Registrasi, GET /me
│       ├── requests/      # CRUD permintaan (controller + service + repository)
│       └── approvals/     # Decide, riwayat persetujuan
├── test/
│   ├── app.e2e-spec.ts    # E2E seluruh alur
│   └── jest-e2e.json
├── scripts/
│   └── generate-swagger.ts
├── swagger.yml            # Spesifikasi OpenAPI (dihasilkan / dirawat)
├── package.json
└── README.md
```

Setiap modul bisnis (`users`, `requests`, `approvals`) mengikuti pola yang sama: **controller** → **service** → **repository**. Lapisan **repository** satu-satunya yang memanggil Prisma untuk akses data; **service** berisi logika bisnis dan aturan akses (role, kepemilikan).

---

## Arsitektur: Layered & Repository Pattern

Aplikasi ini memakai **Layered Architecture** (presentation → application/business → data) dikombinasikan dengan **Repository Pattern** untuk akses data. Berikut alasan dan pertimbangannya dalam konteks proyek ini.

### Apa yang dipakai

- **Layered:**  
  - **Controller:** menangani HTTP (request/response), validasi input (DTO), memanggil service.  
  - **Service:** orkestrasi dan aturan bisnis (siapa boleh apa, status PENDING, dll.), memanggil repository untuk baca/tulis data.  
  - **Repository:** operasi ke persistence (Prisma); tidak tahu aturan bisnis.
- **Repository:** Satu kelas per agregat (mis. `RequestsRepository`) yang mengenkapsulasi semua pemanggilan Prisma untuk entitas tersebut. Service tidak mengimpor Prisma; service hanya bergantung pada repository.

### Keuntungan untuk proyek ini

1. **Perubahan di satu tempat yang jelas**  
   Seluruh akses data dikumpulkan di repository. Ketika nanti ada perubahan query, index, atau cara menyimpan data, tim cukup menyentuh layer ini tanpa perlu menyentuh controller maupun service. Untuk tim teknis, ini mengurangi risiko “efek domino” ketika skema database berkembang.

2. **Strategi testing lebih simpel untuk tim**  
   Dengan pemisahan ini, tim bisa:
   - menguji aturan bisnis di service dengan mock repository (tanpa butuh database), dan  
   - menguji integrasi database di level repository atau E2E.  
   Pendekatan ini membuat diskusi antara QA, backend, dan QA automation lebih mudah karena setiap lapisan punya fokus yang jelas.

3. **Lokasi yang eksplisit untuk aturan bisnis**  
   Aturan seperti “hanya CREATOR pemilik yang boleh update” atau “hanya status PENDING yang boleh diubah” secara konsisten ditaruh di service, bukan tersebar di controller atau di query Prisma. Bagi stakeholder bisnis, hal ini membantu memastikan aturan yang disepakati memang terefleksi di satu tempat yang bisa ditinjau ulang bersama.

4. **Pola yang seragam di semua modul**  
   Users, Requests, dan Approvals memakai pola yang sama (controller → service → repository). Bagi tim, ini mengurangi waktu adaptasi ketika pindah mengerjakan modul lain, dan membantu menjaga konsistensi keputusan teknis seiring penambahan fitur baru.

### Kerugian / trade-off untuk proyek ini

1. **Lebih banyak lapisan untuk kasus sangat sederhana**  
   Untuk operasi CRUD yang hanya menyimpan dan membaca data tanpa aturan tambahan, melewati controller → service → repository memang menambah satu hop lagi. Di proyek kecil dengan tim yang ramping, ini terasa sebagai overhead tambahan (lebih banyak file dan lebih banyak tempat yang perlu disentuh saat refactor).

2. **Tambahan abstraksi di atas Prisma**  
   Prisma sendiri sudah menjadi lapisan abstraksi di atas database. Dengan repository, kita menambahkan satu lapisan lagi. Manfaat “bisa mengganti database/ORM dengan mudah” baru benar-benar terasa bila di masa depan ada kebutuhan business/ops untuk itu; selama belum ada kebutuhan tersebut, keuntungan utamanya lebih ke keteraturan struktur dan kemudahan testing, dengan biaya kompleksitas satu lapisan ekstra.

3. **Ukuran domain saat ini masih kecil**  
   Domain aplikasi ini masih relatif sederhana (beberapa entitas, alur persetujuan yang linier, belum banyak variasi aturan bisnis). Secara objektif, pola layered + repository ini sedikit “di depan” kebutuhan saat ini. Nilai tambahnya akan lebih terasa ketika ada tuntutan dari sisi bisnis untuk:
   - menambah jenis permintaan baru,  
   - menambah aturan approval yang lebih kompleks, atau  
   - melibatkan lebih banyak sistem eksternal.  
   Sampai titik itu, pola ini sudah memberikan fondasi yang tertata, dengan biaya ekstra berupa struktur yang lebih formal.

### Kesimpulan

Secara objektif, **Layered + Repository** dipilih di sini untuk memberi **struktur yang rapi, titik sentral untuk aturan bisnis, dan strategi testing yang lebih terarah**, dengan konsekuensi **ada tambahan lapisan dan jumlah file** dibanding pendekatan yang lebih langsung. Untuk produk yang diharapkan bertumbuh dan dijaga dalam jangka menengah/panjang, trade-off ini dianggap seimbang. Untuk prototipe yang benar‑benar sekali pakai dan sangat kecil, pendekatan yang lebih sederhana bisa saja dipilih sebagai alternatif.

---

## API & Dokumentasi

- **Base URL:** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/api/v1/docs` (setelah server berjalan)
- **Spesifikasi OpenAPI:** `swagger.yml` di root proyek (bahasa Indonesia, lengkap)

Ringkasan endpoint:

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login → token JWT | - |
| POST | `/users` | Registrasi pengguna | - |
| GET | `/users/me` | Profil pengguna login | JWT |
| POST | `/requests` | Buat permintaan | JWT (CREATOR) |
| GET | `/requests` | Daftar permintaan (filter, paginasi) | JWT |
| GET | `/requests/:id` | Detail permintaan | JWT |
| PATCH | `/requests/:id` | Ubah permintaan (CREATOR, PENDING) | JWT (CREATOR) |
| POST | `/requests/:id/decide` | Setujui/tolak (APPROVER) | JWT (APPROVER) |
| GET | `/requests/:id/approvals` | Riwayat persetujuan | JWT |

Detail request/response, contoh, dan kode status ada di Swagger UI dan `swagger.yml`. Untuk memperbarui `swagger.yml` setelah mengubah controller/DTO:

```bash
pnpm run docs:generate
```

---

## Basis Data

- **ORM:** Prisma 7, provider MySQL (dengan adapter MariaDB di runtime).
- **Migrasi:**  
  `pnpm prisma migrate deploy` (produksi) atau `pnpm prisma migrate dev` (development).
- **Seed:**  
  `pnpm run db:seed` — membuat/update akun **CREATOR** (`creator@dot-id.local` / `creator123`) dan **APPROVER** (`approver@dot-id.local` / `approver123`).
- **Reset penuh:**  
  `pnpm run db:reset` — drop database, jalankan ulang migrasi, lalu seed (konfirmasi diminta).

---

## Testing

- **Unit (Jest):** `pnpm test` (sesuai konfigurasi Jest di `package.json`).
- **E2E:**  
  `pnpm run test:e2e` — menjalankan `test/app.e2e-spec.ts` terhadap API lengkap (auth, users, requests, approvals). Memerlukan database yang bisa diakses dan `.env` yang benar (termasuk `JWT_SECRET`, `DATABASE_*`).

---

## Skrip NPM

| Perintah | Kegunaan |
|----------|----------|
| `pnpm run start:dev` | Server development (watch) |
| `pnpm run build` | Build produksi |
| `pnpm run start:prod` | Jalankan build produksi |
| `pnpm test` | Unit test (Jest) |
| `pnpm run test:e2e` | E2E test |
| `pnpm run db:seed` | Seed akun CREATOR & APPROVER |
| `pnpm run db:reset` | Reset DB + migrasi + seed |
| `pnpm run docs:generate` | Generate `swagger.yml` dari kode |
| `pnpm run lint` | ESLint |
| `pnpm run format` | Pretti


