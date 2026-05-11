const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.sqlite');

// Buat tabel jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipe TEXT,
  jumlah INTEGER,
  kategori TEXT DEFAULT 'Lainnya',
  keterangan TEXT,
  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Migration kolom kategori (jika database lama)
db.run(`ALTER TABLE transactions ADD COLUMN kategori TEXT DEFAULT 'Lainnya'`, () => {});

// ---------- ENDPOINT LAMA (ringkasan + 15 transaksi terbaru) ----------
app.get('/api/data', (req, res) => {
  const sumSql = `
    SELECT
      COALESCE(SUM(CASE WHEN tipe='masuk' THEN jumlah ELSE 0 END), 0) as masuk,
      COALESCE(SUM(CASE WHEN tipe='keluar' THEN jumlah ELSE 0 END), 0) as keluar,
      COALESCE(SUM(CASE WHEN tipe='masuk' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now') THEN jumlah ELSE 0 END), 0) as masuk_bulan_ini,
      COALESCE(SUM(CASE WHEN tipe='keluar' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now') THEN jumlah ELSE 0 END), 0) as keluar_bulan_ini,
      COALESCE(SUM(CASE WHEN tipe='masuk' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now', '-1 month') THEN jumlah ELSE 0 END), 0) as masuk_bulan_lalu,
      COALESCE(SUM(CASE WHEN tipe='keluar' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now', '-1 month') THEN jumlah ELSE 0 END), 0) as keluar_bulan_lalu
    FROM transactions
  `;
  const listSql = `SELECT * FROM transactions ORDER BY tanggal DESC, id DESC LIMIT 15`;

  db.get(sumSql, (err, summary) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all(listSql, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Fungsi untuk menghitung persentase perubahan
      const hitungPersentase = (sekarang, sebelumnya) => {
        if (sebelumnya === 0) return sekarang > 0 ? 100 : 0;
        return (((sekarang - sebelumnya) / sebelumnya) * 100).toFixed(2);
      };

      res.json({
        summary: {
          pemasukan: summary.masuk,
          pengeluaran: summary.keluar,
          saldo: summary.masuk - summary.keluar
        },
        comparison: {
          pemasukanBulanIni: summary.masuk_bulan_ini,
          persentasePemasukan: Number(hitungPersentase(summary.masuk_bulan_ini, summary.masuk_bulan_lalu)),
          pengeluaranBulanIni: summary.keluar_bulan_ini,
          persentasePengeluaran: Number(hitungPersentase(summary.keluar_bulan_ini, summary.keluar_bulan_lalu))
        },
        transactions: rows
      });
    });
  });
});

// ---------- ENDPOINT BARU : DATA TREN PER TANGGAL (30 HARI TERAKHIR) ----------
app.get('/api/trend', (req, res) => {
  // Ambil 30 hari terakhir dari hari ini
  const query = `
    WITH dates AS (
      SELECT DATE('now', '-29 days') AS tanggal
      UNION ALL
      SELECT DATE(tanggal, '+1 day')
      FROM dates
      WHERE tanggal < DATE('now')
    )
    SELECT
      d.tanggal,
      COALESCE(SUM(CASE WHEN t.tipe = 'masuk' THEN t.jumlah ELSE 0 END), 0) AS pemasukan,
      COALESCE(SUM(CASE WHEN t.tipe = 'keluar' THEN t.jumlah ELSE 0 END), 0) AS pengeluaran
    FROM dates d
    LEFT JOIN transactions t ON DATE(t.tanggal) = d.tanggal
    GROUP BY d.tanggal
    ORDER BY d.tanggal ASC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST transaksi baru
app.post('/api/transaksi', (req, res) => {
  const { tipe, jumlah, kategori, keterangan } = req.body;
  if (!tipe || !jumlah || jumlah <= 0) {
    return res.status(400).json({ error: 'Tipe & jumlah positif wajib diisi' });
  }
  db.run(
    `INSERT INTO transactions (tipe, jumlah, kategori, keterangan) VALUES (?,?,?,?)`,
    [tipe, Number(jumlah), kategori || 'Lainnya', keterangan || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: 'success', id: this.lastID });
    }
  );
});

// Reset database
app.delete('/api/reset', (req, res) => {
  db.run('DELETE FROM transactions', [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'success', message: 'Semua data dihapus' });
  });
});

// Export CSV
app.get('/api/export', (req, res) => {
  db.all(`SELECT tipe, kategori, jumlah, keterangan, tanggal FROM transactions ORDER BY tanggal`, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    
    // Mengubah layout header seperti buku tabungan / laporan akuntansi
    let csv = "Tanggal,Waktu,Kategori,Keterangan,Pemasukan,Pengeluaran\n";
    
    rows.forEach(r => {
      const [tanggal, waktu] = (r.tanggal || '- -').split(' ');
      const kategori = `"${(r.kategori || 'Lainnya').replace(/"/g, '""')}"`;
      const keterangan = `"${(r.keterangan || '').replace(/"/g, '""')}"`;
      const pemasukan = r.tipe === 'masuk' ? r.jumlah : 0;
      const pengeluaran = r.tipe === 'keluar' ? r.jumlah : 0;
      
      csv += `${tanggal},${waktu},${kategori},${keterangan},${pemasukan},${pengeluaran}\n`;
    });
    res.setHeader('Content-disposition', 'attachment; filename=laporan_keuangan.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  });
});

app.listen(port, () => {
  const asciiArt = `
 _   _                             _    ____ ___ 
| \\ | | _____  __ _   _ ___   _   / \\  |  _ \\_ _|
|  \\| |/ _ \\ \\/ /| | | / __| (_) / _ \\ | |_) | | 
| |\\  |  __/>  < | |_| \\__ \\  _ / ___ \\|  __/| | 
|_| \\_|\\___/_/\\_\\ \\__,_|___/ (_)_/   \\_\\_|  |___|

====================================================
  System: Nexus Financial API
  Status: Online & Ready
  URL   : http://localhost:${port}
====================================================`;
  console.log(asciiArt);
});