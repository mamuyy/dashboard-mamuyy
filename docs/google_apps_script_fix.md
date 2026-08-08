# 🛠️ Panduan Patch Minimal & Aman Google Apps Script (`Code.gs`)

### 📌 Catatan Keamanan Struktur Kolom
Untuk menjaga agar urutan kolom data pada Google Sheets asli milik kamu tidak bergeser (jika ada kolom khusus/kustom di sheet `Log FU`), **patch yang paling aman cukup menambahkan 2 baris** pada handler `sync` yang **sudah ada** di script kamu tanpa mengubah susunan kolom asli.

---

### 💡 Patch Minimal (Cukup Tambah 2 Baris)

Di dalam file **`Code.gs`** pada handler `action === 'sync'`, tambahkan pembersihan sheet sebelum data ditulis ulang:

```javascript
if (action === 'sync') {
  var logs = payload.logs || [];
  var sheet = ss.getSheetByName('Log FU');
  if (!sheet) sheet = ss.insertSheet('Log FU');

  // ▼▼▼ TAMBAHAN 2 BARIS BARU (SISIPKAN DI SINI) ▼▼▼
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]); // Menggunakan array `headers` asli milik script kamu
  // ▲▲▲ TAMBAHAN BARU ▲▲▲

  // ... lanjutkan kode penulisan rows yang SUDAH ADA di script kamu (JANGAN DIUBAH) ...
}
```

---

### 🔍 Mengapa Cukup 2 Baris Ini?
1. `sheet.clearContents()`: Mengosongkan seluruh isi sheet `Log FU` sehingga entri log yang sudah dihapus di client tidak tersisa lagi di Google Sheets.
2. `sheet.getRange(1, 1, 1, headers.length).setValues([headers])`: Mengembalikan baris header pertama menggunakan array `headers` asli yang sudah terdefinisi pada script kamu, sehingga struktur kolom tidak akan pernah tertukar atau bergeser.

---

### 📁 Referensi Kode Penuh (Jika Buat Script Baru dari Nol)
Referensi kode utuh tersedia di repositori:
👉 [google_apps_script_backend.gs](file:///Users/admin_pds/dashboard-mamuyy/google_apps_script_backend.gs)
