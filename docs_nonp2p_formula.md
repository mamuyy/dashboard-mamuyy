# Formula Non-P2P Manual (Verifikasi/Surat)

Referensi implementasi ada di `index.html`.

## 1) Klasifikasi invoice ke Non-P2P Manual
Invoice masuk kelas `nonp2p_manual` jika:
- `classification === nonp2p_manual`, atau
- `type === nonp2p`, atau
- `type === pymad_nonp2p`.

Selain itu, jika `type === migrasi` maka masuk `nonp2p_migrasi`.

## 2) Rules progress untuk Non-P2P Manual
Urutan rule pada `getInvoiceProgress(inv)`:
1. Jika `pay === Paid` => `paid`.
2. Jika class `nonp2p_manual`:
   - jika **Document Number SAP / invoice (`sNota`) sudah valid** => langsung pindah ke direct follow-up:
     - ada janji jatuh tempo => `direct_janji_overdue`
     - belum ada log => `direct_no_fu`
     - selain itu => `direct_active`
   - jika `sSrt === Rejected` => `surat_rejected`
   - jika `sSrt !== Completed` => `surat_pending`
   - jika nomor surat (`noSrt`) tidak valid => `surat_pending`
   - fallback kompatibilitas lama: setelah surat valid, tetap masuk direct follow-up.

## 3) Angka kartu lane Non-P2P

### 3.1 Kartu “Verifikasi (Operasi/Surat)” pada Non-P2P Manual
- **Count** (`dp-np-manual`) = jumlah invoice unpaid dengan business class `nonp2p_manual`.
- **Nilai** (`dp-np-manual-val`) = total `amt` invoice di atas.
- **Meta** (`dp-np-manual-meta`) = split ownership berdasarkan readiness handoff SAP:
  - `Ops` = `!isSapEnteredForManual(inv)` **dan** `!isFinanceCompleteForManual(inv)`.
  - `Surat` = `!isSapEnteredForManual(inv)` **dan** `isFinanceCompleteForManual(inv)`.
  - `FU` = `isSapEnteredForManual(inv)`.

Secara konsep:
- `manual_count = unpaid_nonp2p_manual.length`
- `manual_value = sum(unpaid_nonp2p_manual.amt)`
- `manual_ops = count(!sap_entered && !finance_complete)`
- `manual_surat = count(!sap_entered && finance_complete)`
- `manual_fu = count(sap_entered)`

### 3.2 Kartu “Siap FU” dan “FU” pada Non-P2P Manual
- **Siap FU** (`dp-np-manual-ready`) = invoice manual yang sudah SAP entered **dan** belum ada aktivitas FU (`direct_no_fu`).
- **FU** (`dp-np-manual-fu`) = invoice manual yang sudah SAP entered **dan** sudah punya aktivitas FU (`direct_active` / `direct_janji_overdue`).

## 4) Bedanya Non-P2P Manual vs Non-P2P Migrasi (konsep bisnis)

### Non-P2P Manual
- **Sumber data**: invoice Non-P2P dari Finance Accounting (file operasional saat ini).
- **Ciri utama**: ada proses **handoff ke SAP**; setelah `sNota` (Document Number SAP) valid, item dianggap siap ditangani tim FU.
- **Alur**: Operasi/Surat (verifikasi) → Siap FU (`direct_no_fu`) → FU aktif (`direct_active`/`direct_janji_overdue`).
- **Split metrik kartu**:
  - `Ops` = belum SAP entered & belum finance complete,
  - `Surat` = belum SAP entered tapi surat/nomor surat sudah valid,
  - `FU` = sudah SAP entered.

### Non-P2P Migrasi
- **Sumber data**: saldo legacy dari FBL5N yang tidak terpetakan di Finance Accounting aktif.
- **Ciri utama**: diperlakukan sebagai **direct follow-up** sejak awal (tanpa menunggu tahapan BA/Surat/Nota/MIR7).
- **Alur**: Review Legacy → Validasi (belum FU) → Closed/FU (sudah ada aktivitas FU atau janji jatuh tempo).
- **Konstruksi data**:
  - per dokumen (utama) jika ada `Document Number`/`Reference` dari FBL5N,
  - fallback per customer bila dokumen tidak tersedia.
- **Kartu lane migrasi**:
  - `dp-np-migrasi` / `dp-np-migrasi-val` = total invoice/nilai business class `nonp2p_migrasi`.
  - `dp-np-migrasi-ready` = progress key `direct_no_fu`.
  - `dp-np-migrasi-fu` = progress key `direct_active` atau `direct_janji_overdue`.

Intinya: **Manual** adalah Non-P2P berjalan yang masih melalui verifikasi internal/handoff SAP sebelum FU; **Migrasi** adalah backlog legacy SAP yang langsung dikelola di jalur direct FU.
