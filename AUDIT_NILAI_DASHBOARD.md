# Audit Nilai & Dashboard

Tanggal audit: 2026-04-24
File utama: `index.html`

## Ringkasan cepat
- **Mayoritas angka dashboard bersifat dinamis** (diisi dari `invs`, `logs`, `agMap`, `agTotals` pada `renderDash()`).
- **Ada angka yang inline/hardcoded sebagai parameter bisnis & fallback**, terutama:
  - bobot KPI,
  - threshold band skor,
  - target progress bar,
  - data dummy ketika data riil belum cukup.

## Temuan detail

### 1) Angka dinamis (bukan inline statis)
Dashboard utama mengisi nilai elemen `dp-*`, `dk-*`, dan summary (`ds-*`) dari hasil perhitungan data runtime.
Contoh:
- Pipeline count/value (`dp-ba`, `dp-srt`, `dp-mir`, `dp-fu`, dsb.) dihitung dari list invoice progres lalu dipush ke DOM.
- KPI ringkas (`dk-ar90pct`, `dk-mir7k`, `dk-srt`, `dk-bfu`, `dk-janji`, `dk-fuhari`) dihitung dari invoice/log real.
- Summary piutang (`ds-piutang`) mengambil basis `agGrandTotal` (FBL5N) jika tersedia.

### 2) Angka inline (konfigurasi/aturan)
Nilai berikut hardcoded di source (wajar untuk rule/config):
- `KPI_PIC_WEIGHTS` dan `KPI_SURAT_WEIGHTS`.
- `KPI_SURAT_TARGETS` (`dailyLog:2`, `outputDone:10`).
- Threshold band skor `getKpiBand()` (82/70/58).
- Skala progress bar/alert:
  - target AR90 >10%,
  - FU target `5/PIC`,
  - `srtBelum/10`, `belumFU/20` untuk bar.
- Dummy metric (`KPI_PIC_DUMMY`, `KPI_SURAT_DUMMY`) dan fallback score default.

### 3) Potensi "angka berbeda" yang perlu dipahami
Perbedaan angka bisa muncul karena memang basis hitung berbeda:
- `AR >90%` untuk kartu KPI memakai basis **`agGrandTotal` jika ada**, fallback ke total unpaid invoice.
- Alert `ar90pctN` masih dihitung terhadap `totalAmt` unpaid invoice (bukan `agGrandTotal`) sehingga bisa beda tipis dengan kartu KPI.
- `totMig` dipakai sebagai balancing figure terhadap `agGrandTotal`; ini sengaja agar rekonsiliasi total klop.

## Kesimpulan audit
- **Tidak ditemukan indikasi angka dashboard di-hardcode secara langsung pada elemen utama** (count/nominal utama di-render dari data runtime).
- **Ada inline angka rule/config** yang memengaruhi hasil KPI/score/progress; ini yang paling mungkin jadi sumber perbedaan output setelah banyak modifikasi.

## Saran tindak lanjut
1. Pindahkan semua konstanta rule ke satu objek konfigurasi terpusat (mis. `DASH_RULES`) agar mudah review perubahan.
2. Samakan basis perhitungan AR90 antara kartu KPI dan alert (pilih salah satu: `agGrandTotal` atau `totalAmt`).
3. Tambahkan "debug panel" kecil yang menampilkan formula + basis denominator aktif, supaya audit cepat saat ada mismatch.
