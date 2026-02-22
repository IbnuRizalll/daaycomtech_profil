# DaayComTech Website

Website company profile + katalog produk dengan panel admin.

## Fitur Utama
- Halaman publik: Beranda, Produk, Detail Produk, Tentang Kami, Kontak, Detail Berita/Artikel, Detail Achievement.
- Admin: manajemen produk, klien, pesan, berita/artikel, achievement, dan admin (khusus superadmin).
- Aktivasi admin berbasis invite token + audit logs untuk aksi sensitif admin.
- Multi-image upload untuk produk + upload image untuk berita/artikel dan achievement (tersimpan di `/public/uploads`).
- Form kontak menyimpan pesan + nomor HP.
- Admin membalas via Gmail/WhatsApp (tanpa SMTP).
- Highlight berita & achievement di beranda + tampilan dinamis dari database.
- Search produk dengan highlight kata + suggestion (tanpa refresh penuh).

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- MySQL
- NextAuth (Credentials)

## Arsitektur (Ringkas)
Diagram alur utama:
```text
Browser
  | (public pages)
  v
Next.js App Router (Server Components) ----> Prisma ----> MySQL
  | (client pages/admin)
  v
Next.js API Routes (/app/api/*) -----------> Prisma ----> MySQL
  |
  v
Upload API -> /public/uploads (WebP compressed)
```

Struktur aplikasi:
- Halaman publik di `app/*` (server component, data langsung dari Prisma).
- Halaman admin di `app/admin/*` (client component, fetch ke API).
- API routes di `app/api/*` untuk CRUD + upload + import.
- Komponen UI reusable di `components/*`.
- Util bersama di `lib/*` (contoh: format harga, normalize content blocks).

## Alur Data Utama
- Public pages (beranda, produk, artikel, achievement) membaca DB langsung via Prisma di server component.
- Admin pages memakai fetch ke API routes (POST/PATCH/DELETE) agar aman di client.
- Session admin dikelola NextAuth (credentials) dan diverifikasi di API.
- Upload file tersimpan di `public/uploads` dan dioptimasi ke WebP (max 1600px).

## Alur Fitur Penting
- Produk: admin CRUD -> API -> Prisma -> DB -> tampil di public. Search & filter lewat `/api/products`.
- Artikel/Achievement: admin susun blok konten (paragraph/image/list/table) -> API -> DB -> detail page render blok.
- Kontak: form kirim pesan -> simpan DB -> admin baca & balas via Gmail/WhatsApp.
- Klien: admin CRUD -> tampil di beranda (animasi marquee).

## Setup Lokal

### Prasyarat
- Node.js 18+
- MySQL

### Langkah
1. Install dependencies:
   ```bash
   npm install
   ```

2. Buat `.env` di root:
   ```env
   # Database
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/db_dct"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="ganti_dengan_secret_acak"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_WHATSAPP_NUMBER="628123456789"
   NEXT_PUBLIC_COMPANY_EMAIL="info@daaycomtech.com"
   NEXT_PUBLIC_COMPANY_ADDRESS="Jl. Example No. 123, Jakarta, Indonesia"

   # Contact email validation policy:
   # allow (default) | google_microsoft_only
   CONTACT_EMAIL_PROVIDER_POLICY="allow"

   # Admin email validation policy (dipakai saat create admin + login via email):
   # default: google_microsoft_only
   # opsi: allow | google_microsoft_only
   ADMIN_EMAIL_PROVIDER_POLICY="google_microsoft_only"

   # Masa berlaku invite token admin (jam)
   ADMIN_INVITE_TTL_HOURS="24"
   ```

3. Sinkronkan database:
   ```bash
   npx prisma generate
   npm run db:push
   ```

4. (Opsional) Seed data contoh:
   ```bash
   npm run db:seed
   ```

5. Jalankan dev server:
   ```bash
   npm run dev
   ```

Buka http://localhost:3000

## Setup Dual Boot (Windows + Ubuntu Docker)
- Windows tetap pakai XAMPP MySQL di port `3306` melalui `.env`.
- Ubuntu pakai Docker MySQL di port `3307` melalui `.env.ubuntu`.
- Konfigurasi ini tidak saling bentrok karena port DB berbeda.

### Prasyarat Ubuntu Docker (sekali setup)
1. Install Docker:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   ```
2. Aktifkan service Docker:
   ```bash
   sudo systemctl enable --now docker
   ```
3. Tambahkan user ke group docker:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```
4. Verifikasi:
   ```bash
   docker info
   docker compose version
   ```

### Jalankan di Ubuntu (mode Docker)
1. Install dependencies Linux:
   ```bash
   npm ci
   ```
2. Start MySQL Docker Ubuntu:
   ```bash
   npm run ubuntu:db:up
   ```
   Perintah ini otomatis menunggu container MySQL sampai status `healthy`.
   phpMyAdmin juga ikut aktif di `http://localhost:8080`.
3. Push schema ke MySQL Docker:
   ```bash
   npm run ubuntu:db:push
   ```
4. (Opsional) Seed data:
   ```bash
   npm run ubuntu:db:seed
   ```
5. Jalankan dev server dengan env Ubuntu:
   ```bash
   npm run ubuntu:dev
   ```

### Prisma Studio (Windows vs Ubuntu)
- Windows (MySQL lokal/XAMPP, port `3306`, pakai `.env`):
  ```bash
  npm run db:studio
  ```
- Ubuntu Docker (MySQL container, port `3307`, pakai `.env.ubuntu`):
  ```bash
  npm run ubuntu:db:up
  bash scripts/ubuntu-run.sh npx prisma studio
  ```
- Cek env aktif untuk mode Ubuntu:
  ```bash
  bash scripts/ubuntu-run.sh sh -lc 'echo $DATABASE_URL'
  ```
  Output yang benar: `mysql://app:app@127.0.0.1:3307/db_dct`
- Catatan: `ubuntu-run.sh` bukan command global, jadi jalankan via path `bash scripts/ubuntu-run.sh ...`.

### Stop/Reset DB Ubuntu
```bash
npm run ubuntu:db:down
npm run ubuntu:db:reset
```

### Akses phpMyAdmin (Ubuntu Docker)
- URL: `http://localhost:8080`
- Login:
  - Username: `app`
  - Password: `app`
- Alternatif login admin:
  - Username: `root`
  - Password: `root`
- Server/Host (jika diminta): `mysql`

### Troubleshooting Docker Ubuntu
- `permission denied while trying to connect to the Docker daemon socket`:
  jalankan ulang langkah "Tambahkan user ke group docker", lalu tutup dan buka lagi terminal/VS Code.
- `container ... is unhealthy`:
  ```bash
  docker compose -f docker-compose.ubuntu.yml down -v
  docker compose -f docker-compose.ubuntu.yml pull
  npm run ubuntu:db:up
  ```
- Cek status dan log container:
  ```bash
  docker compose -f docker-compose.ubuntu.yml ps
  docker logs --tail 200 daaycomtech-mysql-ubuntu
  docker logs --tail 200 daaycomtech-phpmyadmin-ubuntu
  ```

### Catatan penting dual boot
- Jangan share `node_modules` antara Windows dan Ubuntu.
- Saat pindah OS, install ulang dependencies di OS tersebut (`npm ci`).

## Admin
- URL login: `/auth/login`
- Login admin menggunakan email + password (tanpa username).
- Superadmin membuat undangan admin baru dari halaman `/admin/admins`.
- Link aktivasi dikirim ke calon admin, lalu calon admin set password di `/auth/activate?token=...`.
- Reset password hanya via superadmin di panel admin (halaman "Lupa Password" publik dihapus).
- Audit logs admin bisa dilihat superadmin di `/admin/audit-logs` atau API `GET /api/audit-logs`.
- Jika menjalankan seed, akun default:
  - Email: `ibnurizal.m22@gmail.com`
  - Password: `admin123`

## Scripts
- `npm run dev` – dev server
- `npm run build` – build production
- `npm start` – start production
- `npm run lint` – jalankan ESLint lokal
- `npm run lint:ci` – ESLint untuk CI (fail jika ada warning/error)
- `npm run db:push` – push schema ke DB
- `npm run db:seed` – seed data
- `npm run db:studio` – Prisma Studio dengan `.env` (umumnya Windows/XAMPP `localhost:3306`)
- `npm run ubuntu:db:up` – start MySQL + phpMyAdmin Docker Ubuntu dan tunggu healthy
- `npm run ubuntu:db:down` – stop container Docker Ubuntu
- `npm run ubuntu:db:reset` – reset volume DB Ubuntu (hapus data)
- `npm run ubuntu:db:push` – push Prisma schema ke MySQL Docker Ubuntu
- `npm run ubuntu:db:seed` – seed data ke MySQL Docker Ubuntu
- `npm run ubuntu:dev` – jalankan Next.js dev dengan env Ubuntu (`.env.ubuntu`)
- `bash scripts/ubuntu-run.sh npx prisma studio` – Prisma Studio dengan `.env.ubuntu` (Ubuntu Docker `127.0.0.1:3307`)

## Catatan Penting
- Upload gambar produk/berita/achievement tersimpan di `public/uploads`.
- Fallback image admin menggunakan `public/images/team/team.png`.
- Admin page tidak memakai header/footer publik.
- Setelah perubahan schema Prisma, jalankan `npm run db:push`.
- Endpoint kontak memvalidasi email server-side: format, domain disposable, dan DNS (MX/A/AAAA).
- Jika `CONTACT_EMAIL_PROVIDER_POLICY="google_microsoft_only"`, form kontak hanya menerima email aktif yang terdeteksi memakai Google atau Microsoft mail infrastructure.
- Endpoint admin memvalidasi email server-side saat membuat admin baru dan saat login via email (blok disposable/domain invalid).
- Jika `ADMIN_EMAIL_PROVIDER_POLICY="google_microsoft_only"`, login admin via email dan pembuatan admin baru dibatasi ke email Google/Microsoft aktif.
- Endpoint invite admin memakai token hash (SHA-256), satu kali pakai, dan punya expiry (`ADMIN_INVITE_TTL_HOURS`).

## Deployment (Singkat)
- Set env variables di server/Vercel sesuai `.env`.
- Jalankan `npm run build` lalu `npm start`.
