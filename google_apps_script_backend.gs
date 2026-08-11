/**
 * GOOGLE APPS SCRIPT BACKEND - DASHBOARD PENAGIHAN PELINDO
 * 
 * Silakan copy-paste seluruh kode ini ke Google Apps Script Editor (Code.gs),
 * lalu deploy sebagai Web App (Execute as: Me, Who has access: Anyone).
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'get_all';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'get_invs') {
    var sheetInvs = ss.getSheetByName('Invoices');
    var invs = [];
    var updatedAt = '';
    if (sheetInvs) {
      var data = sheetInvs.getDataRange().getValues();
      if (data.length > 1) {
        var headers = data[0];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0]) continue;
          invs.push({
            no: String(row[0] || ''),
            cust: String(row[1] || ''),
            amt: Number(row[2] || 0),
            pay: String(row[3] || ''),
            picB: String(row[4] || ''),
            picResume: String(row[5] || ''),
            sBA: String(row[6] || ''),
            sSrt: String(row[7] || ''),
            sMIR: String(row[8] || ''),
            sNota: String(row[9] || ''),
            tgl: String(row[10] || ''),
            type: String(row[11] || ''),
            desc: String(row[12] || ''),
            noBA: String(row[13] || ''),
            noSrt: String(row[14] || ''),
            noMIR: String(row[15] || '')
          });
        }
      }
      var prop = PropertiesService.getScriptProperties().getProperty('INVS_UPDATED_AT');
      updatedAt = prop || new Date().toISOString();
    }
    return jsonResponse({ ok: true, invs: invs, updatedAt: updatedAt });
  }

  if (action === 'get_aging') {
    var sheetAg = ss.getSheetByName('Aging');
    var agMap = {};
    if (sheetAg) {
      var data = sheetAg.getDataRange().getValues();
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          var r = data[i];
          if (!r[0]) continue;
          agMap[String(r[0])] = {
            d30: Number(r[1] || 0),
            d60: Number(r[2] || 0),
            d90: Number(r[3] || 0),
            d120: Number(r[4] || 0),
            d150: Number(r[5] || 0),
            d180: Number(r[6] || 0),
            d210: Number(r[7] || 0),
            d360: Number(r[8] || 0),
            dOld: Number(r[9] || 0),
            total: Number(r[10] || 0),
            o90: Number(r[11] || 0)
          };
        }
      }
    }
    return jsonResponse({ ok: true, agMap: agMap });
  }

  if (action === 'get_logs') {
    var sheetLogs = ss.getSheetByName('Log FU');
    var logs = [];
    if (sheetLogs) {
      var data = sheetLogs.getDataRange().getValues();
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          var r = data[i];
          if (!r[0] && !r[1]) continue;
          logs.push({
            id: String(r[0] || ''),
            inv: String(r[1] || ''),
            cust: String(r[2] || ''),
            date: formatDateForClient(r[3]),
            hasil: String(r[4] || ''),
            ch: String(r[5] || ''),
            note: String(r[6] || ''),
            nx: String(r[7] || ''),
            bukti: String(r[8] || ''),
            jt: formatDateForClient(r[9]),
            jn: Number(r[10] || 0),
            pic: String(r[11] || ''),
            ts: String(r[12] || '')
          });
        }
      }
    }
    return jsonResponse({ ok: true, logs: logs });
  }

  return jsonResponse({ ok: true, status: 'Apps Script Ready' });
}

function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : '';
    var payload = contents ? JSON.parse(contents) : {};
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ═══ HANDLER ACTION: 'sync' (FULL OVERWRITE / DELETE SAFE) ═══
    // PERBAIKAN: Harus clearContents() dahulu agar entri yang dihapus client tidak tertinggal!
    if (action === 'sync') {
      var logs = payload.logs || [];
      var sheet = ss.getSheetByName('Log FU');
      if (!sheet) {
        sheet = ss.insertSheet('Log FU');
      }

      // Clear seluruh isian sheet Log FU agar baris yang dihapus hilang total di Sheets
      sheet.clearContents();

      // Tulis Header
      var headers = ['ID', 'No Invoice', 'Customer', 'Tanggal', 'Aktivitas', 'Kanal', 'Catatan', 'Next Step', 'Bukti Link', 'Tanggal Janji', 'Nominal Janji', 'PIC', 'Timestamp'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Tulis data logs baru jika ada
      if (logs.length > 0) {
        var rows = logs.map(function(l) {
          return [
            l.id || '',
            l.inv || '',
            l.cust || '',
            l.date || '',
            l.hasil || '',
            l.ch || '',
            l.note || '',
            l.nx || '',
            l.bukti || '',
            l.jt || '',
            Number(l.jn || 0),
            l.pic || '',
            l.ts || ''
          ];
        });
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      return jsonResponse({ ok: true, count: logs.length, message: 'Log FU successfully overwritten' });
    }

    // ═══ HANDLER ACTION: 'add' (APPEND SINGLE LOG) ═══
    if (action === 'add') {
      var log = payload.log;
      if (log) {
        var sheet = ss.getSheetByName('Log FU');
        if (!sheet) {
          sheet = ss.insertSheet('Log FU');
          sheet.appendRow(['ID', 'No Invoice', 'Customer', 'Tanggal', 'Aktivitas', 'Kanal', 'Catatan', 'Next Step', 'Bukti Link', 'Tanggal Janji', 'Nominal Janji', 'PIC', 'Timestamp']);
        }
        sheet.appendRow([
          log.id || '', log.inv || '', log.cust || '', log.date || '',
          log.hasil || '', log.ch || '', log.note || '', log.nx || '',
          log.bukti || '', log.jt || '', Number(log.jn || 0), log.pic || '', log.ts || ''
        ]);
      }
      return jsonResponse({ ok: true });
    }

    // ═══ HANDLER ACTION: 'push_invs' ═══
    if (action === 'push_invs') {
      var invs = payload.invs || [];
      var sheet = ss.getSheetByName('Invoices');
      if (!sheet) sheet = ss.insertSheet('Invoices');
      sheet.clearContents();
      var headers = ['No Invoice', 'Customer', 'Jumlah', 'Payment', 'PIC Billing', 'PIC Resume', 'sBA', 'sSrt', 'sMIR', 'sNota', 'Tanggal', 'Type', 'Deskripsi', 'No BA', 'No Surat', 'No MIR7'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (invs.length > 0) {
        var rows = invs.map(function(i) {
          return [i.no, i.cust, i.amt, i.pay, i.picB, i.picResume, i.sBA, i.sSrt, i.sMIR, i.sNota, i.tgl, i.type, i.desc, i.noBA, i.noSrt, i.noMIR];
        });
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      var nowIso = payload.updatedAt || new Date().toISOString();
      PropertiesService.getScriptProperties().setProperty('INVS_UPDATED_AT', nowIso);
      return jsonResponse({ ok: true, count: invs.length, updatedAt: nowIso });
    }

    // ═══ HANDLER ACTION: 'push_aging' ═══
    if (action === 'push_aging') {
      var agMap = payload.agMap || {};
      var sheet = ss.getSheetByName('Aging');
      if (!sheet) sheet = ss.insertSheet('Aging');
      sheet.clearContents();
      var headers = ['Customer', '1-30hr', '31-60hr', '61-90hr', '91-120hr', '121-180hr', '181-210hr', '211-360hr', '>360hr', 'dOld', 'Total', 'o90'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      var entries = Object.entries(agMap);
      if (entries.length > 0) {
        var rows = entries.map(function(e) {
          var c = e[0], v = e[1];
          return [c, v.d30||0, v.d60||0, v.d90||0, v.d120||0, v.d150||0, v.d180||0, v.d210||0, v.d360||0, v.dOld||0, v.total||0, v.o90||0];
        });
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      return jsonResponse({ ok: true, count: entries.length });
    }

    // ═══ HANDLER ACTION: 'upload_bukti' ═══
    if (action === 'upload_bukti') {
      var filename = payload.filename || ('bukti_' + Date.now() + '.jpg');
      var mimeType = payload.mimeType || 'image/jpeg';
      var base64 = payload.base64 || '';
      if (!base64) return jsonResponse({ ok: false, error: 'Base64 data empty' });
      
      var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
      var folderName = 'Bukti FollowUp Penagihan';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var url = file.getUrl();
      return jsonResponse({ ok: true, url: url });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch(err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDateForClient(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  var raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  var parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return Utilities.formatDate(parsed, 'Asia/Jakarta', 'yyyy-MM-dd');
  return raw;
}
