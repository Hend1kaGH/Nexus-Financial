# Nexus Financial

Nexus Financial adalah aplikasi pencatatan arus kas (pemasukan & pengeluaran) lokal berbasis Web. Dibangun menggunakan antarmuka yang bersih (bersifat *Single Page Application* sederhana) serta *backend* yang ringan menggunakan Node.js dan SQLite, aplikasi ini cocok digunakan untuk mencatat keuangan pribadi maupun usaha kecil.

## 🎥 Demo Aplikasi

[![Demo Nexus Financial](https://img.youtube.com/vi/Zskm0XHBag4/maxresdefault.jpg)](https://youtu.be/Zskm0XHBag4)

## Fitur Utama

- **Dashboard Informatif**: Menampilkan Ringkasan Saldo Bersih, Total Pemasukan, dan Total Pengeluaran beserta indikator persentase kenaikan/penurunan (dibandingkan bulan lalu).
- **Grafik Tren Harian**: Visualisasi interaktif riwayat transaksi selama 30 hari terakhir menggunakan **Chart.js**.
- **Input Transaksi Cepat**: 
  - Pemisah ribuan otomatis (format Rupiah) pada kolom jumlah.
  - Tombol nominal cepat (*Quick amounts*: +50rb, +100rb, +500rb, +1 Juta, +5 Juta) untuk mengakumulasi angka dengan praktis.
- **Manajemen Transaksi**: Tabel riwayat transaksi dengan format tanggal yang mudah dibaca (misal: *26 Okt 2023*).
- **Export Data**: Unduh laporan keuangan Anda dengan mudah ke dalam format **.CSV** (dapat dibuka di Excel/Google Sheets).
- **Database Lokal (Offline-first)**: Seluruh data aman tersimpan di dalam komputer Anda sendiri menggunakan file `database.sqlite`.

---

## Teknologi yang Digunakan

**Frontend:**
- HTML5 & CSS3 (Variabel CSS & Flexbox/Grid Layout)
- Vanilla JavaScript
- Chart.js (via CDN)

**Backend:**
- Node.js
- Express.js (REST API)
- SQLite3 (Database)

---

## Cara Instalasi & Menjalankan Aplikasi

### Prasyarat
Pastikan Anda sudah menginstal Node.js di sistem Anda.

### Langkah-langkah:

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/Hend1kaGH/Nexus-Financial.git
   ```

2. **Instal dependensi (Express & SQLite3):**
   ```bash
   npm install
   ```

3. **Jalankan server:**
   ```bash
   node server.js
   ```
   *Catatan: Saat dijalankan, Anda akan melihat tampilan ASCII Art "Nexus Financial API" di terminal.*

4. **Buka di Browser:**
   Kunjungi alamat berikut di web browser Anda:
   👉 **http://localhost:3001**

---

## 📂 Struktur Proyek

```text
📁 Nexus Financial/
├── 📁 public/
│   └── 📄 index.html        # Antarmuka web pengguna (UI)
├── 📄 server.js             # Kode Backend Express & API
├── 📄 database.sqlite       # (Dihasilkan Otomatis) Database SQLite
├── 📄 package.json          # Konfigurasi dependensi Node.js
└── 📄 README.md             # Dokumentasi ini
```

---

## 📄 Lisensi

Proyek ini bersifat *Open-Source* dan didistribusikan di bawah Lisensi MIT. Anda bebas memodifikasi dan mengembangkannya sesuai kebutuhan.
