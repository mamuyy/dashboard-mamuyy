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

## 3) Angka kartu “Verifikasi / Surat”
- **Count** (`dp-np-manual`) = jumlah invoice unpaid dengan business class `nonp2p_manual`.
- **Nilai** (`dp-np-manual-val`) = total `amt` dari invoice di atas.
- **Meta** (`dp-np-manual-meta`) = jumlah invoice nonp2p_manual yang progress key-nya:
  - `surat_pending` atau
  - `surat_rejected`.

Secara konsep:
- `verifikasi_surat_count = unpaid_nonp2p_manual.length`
- `verifikasi_surat_value = sum(unpaid_nonp2p_manual.amt)`
- `masih_di_surat = count(progress in ['surat_pending','surat_rejected'])`
