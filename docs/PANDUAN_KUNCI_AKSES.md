# 🔐 Panduan Mengaktifkan Kunci Akses Tim

Tanpa kunci, siapa pun yang tahu URL Apps Script bisa membaca data invoice dan
**menimpa/mengosongkan** sheet (`push_invs`, `push_aging`, `sync`). URL itu
tertulis di `index.html` dan repo ini publik, jadi URL saja tidak cukup aman.

Setelah langkah di bawah, backend hanya melayani permintaan yang membawa kunci
yang benar. Kunci **tidak** ditulis di source code: dibagikan lewat link.

> ⚠️ Ikuti urutannya. Aplikasi versi baru harus sudah live **sebelum** kunci
> diisi di Apps Script, kalau tidak dashboard tim akan terkunci.

---

## Langkah 1 — Pastikan aplikasi versi baru sudah live

Branch berisi perubahan ini harus sudah di-merge ke `main`. Cek: buka dashboard →
menu Setup → di panel **Sinkronisasi Google Sheets** ada kolom **Kunci Akses Tim**.

## Langkah 2 — Tambah pengecekan kunci di Apps Script

Buka Google Sheets → **Extensions → Apps Script** → file `Code.gs`.
**Jangan ganti seluruh script** (script aktif kamu punya handler yang tidak ada
di repo, mis. `get_log_updates`). Cukup:

**a.** Tempel dua fungsi ini di paling atas file:

```javascript
function isAuthorized_(e) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) return true;
  return !!(e && e.parameter && e.parameter.key === expected);
}

function unauthorizedResponse_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**b.** Tambah satu baris ini sebagai **baris pertama** di dalam `doGet(e)` **dan**
di dalam `doPost(e)`:

```javascript
  if (!isAuthorized_(e)) return unauthorizedResponse_();
```

Contoh hasilnya:

```javascript
function doGet(e) {
  if (!isAuthorized_(e)) return unauthorizedResponse_();
  var action = ...   // ← kode lama kamu, jangan diubah
```

**c.** Simpan (Ctrl+S).

## Langkah 3 — Deploy ulang (URL tetap sama)

**Deploy → Manage deployments** → ikon ✏️ (Edit) pada deployment aktif →
**Version: New version** → **Deploy**.

Jangan pilih "New deployment", karena itu akan membuat URL baru.

Sampai sini belum ada yang berubah untuk tim, karena `API_KEY` belum diisi.

## Langkah 4 — Buat & isi kunci

1. Buat kunci acak minimal 20 karakter (huruf + angka), mis. dari password
   manager. Jangan pakai nama, tanggal lahir, atau kata umum.
2. Apps Script → ⚙️ **Project Settings** → **Script Properties** →
   **Add script property**:
   - Property: `API_KEY`
   - Value: *(kunci kamu)*
3. **Save**. Berlaku saat itu juga, tanpa perlu deploy ulang.

## Langkah 5 — Bagikan link ke tim

Kirim link berikut ke grup tim (ganti `KUNCI` dengan kunci kamu):

```
https://dashboard-mamuyy.vercel.app/?key=KUNCI
```

atau

```
https://mamuyy.github.io/dashboard-mamuyy/?key=KUNCI
```

Cukup dibuka **sekali** per perangkat/browser. Kunci tersimpan otomatis, lalu
dihapus dari address bar. Setelah itu tim bisa pakai link biasa (tanpa `?key=`).

Kamu sendiri juga harus membuka link ini di setiap perangkatmu.

## Langkah 6 — Tes

1. Buka dashboard di **jendela Incognito** tanpa `?key=`. Harus muncul
   "⛔ Kunci akses tim salah/belum diisi" dan data tidak termuat.
2. Buka dengan `?key=KUNCI`. Data harus termuat normal.

## Langkah 7 — Matikan deployment lama

Di `index.html` masih tercatat URL Apps Script lama (`LEGACY_GS_URL`). Kalau
deployment itu masih aktif, dia **tidak** terkunci. Buka **Deploy → Manage
deployments**, lalu **Archive** deployment lama yang tidak dipakai lagi. Kalau
URL lama itu berasal dari script lain, arsipkan juga di script tersebut.

---

## Kalau kunci bocor / ada anggota tim keluar

Ganti nilai `API_KEY` di Script Properties, lalu bagikan link baru. Semua
perangkat dengan kunci lama otomatis tidak bisa mengambil data lagi.

## Kalau tim terkunci karena salah urutan

Hapus property `API_KEY` di Script Properties. Akses langsung terbuka lagi.
Setelah itu ulangi dari langkah yang terlewat.
