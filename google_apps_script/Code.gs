/**
 * ==============================================================================
 * MYlog — Google Apps Script Backend (Web App) v2.0 Final
 * Vila: Agranusa Signature Villa
 * Database: Google Sheets (Single Source of Truth)
 * Akses: Supervisor Operasional (Bebas Login / Akses Cepat)
 * ==============================================================================
 * 
 * CARA PAKAI:
 * 1. Buka Google Sheet Anda (MYlog_Agranusa_Master).
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode default, lalu tempelkan seluruh kode ini.
 * 4. Klik ikon "Simpan" (Ctrl+S).
 * 5. Jalankan fungsi "setupDatabaseSheets()" sekali untuk membuat seluruh 10 tab otomatis.
 * 6. Klik "Deploy" -> "Deployment baru" (New deployment) -> Pilih jenis "Aplikasi web" (Web app).
 * 7. Pada "Siapa yang memiliki akses", pilih "Siapa saja" (Anyone).
 * 8. Klik "Deploy", izinkan akses akun Google Anda, lalu salin URL Web App yang dihasilkan.
 * 9. Tempel URL tersebut ke konfigurasi Vercel / file .env.local:
 *    GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

const TZ = 'Asia/Makassar';

const TABS = {
  DAILY_READINGS: 'DailyReadings',
  FUEL_USAGE: 'FuelUsage',
  OPERATING_EXPENSES: 'OperatingExpenses',
  METER_CYCLES: 'MeterCycles',
  INTERVAL_ALLOCATIONS: 'IntervalAllocations',
  TARIFF_CONFIG: 'TariffConfig',
  TARIFF_HISTORY: 'TariffHistory',
  MONTHLY_BUDGETS: 'MonthlyBudgets',
  AUDIT_LOG: 'AuditLog',
  APP_SETTINGS: 'AppSettings',
};

/**
 * 1. Inisialisasi 10 Tab Database Otomatis
 * Jalankan fungsi ini SEKALI melalui tombol Run di Apps Script
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const tabConfigs = [
    {
      name: TABS.DAILY_READINGS,
      headers: ['id', 'date', 'electricityMeter', 'waterMeter', 'gasMeter', 'recordedAt', 'recordedBy', 'isArchived', 'version']
    },
    {
      name: TABS.FUEL_USAGE,
      headers: ['id', 'date', 'solarLiters', 'gensetStatus', 'recordedAt', 'recordedBy', 'isArchived', 'version']
    },
    {
      name: TABS.OPERATING_EXPENSES,
      headers: ['id', 'date', 'totalAmount', 'recordedAt', 'recordedBy', 'isArchived', 'version']
    },
    {
      name: TABS.METER_CYCLES,
      headers: ['id', 'utility', 'resetDate', 'oldMeterFinal', 'newMeterBaseline', 'reason', 'recordedBy', 'recordedAt']
    },
    {
      name: TABS.INTERVAL_ALLOCATIONS,
      headers: ['id', 'utility', 'startDate', 'endDate', 'totalConsumption', 'allocatedJson', 'reason']
    },
    {
      name: TABS.TARIFF_CONFIG,
      headers: ['id', 'utility', 'effectiveDate', 'baseRatePerUnit', 'monthlyFixedCost', 'percentageComponentRate', 'percentageBasis', 'isConfigured']
    },
    {
      name: TABS.TARIFF_HISTORY,
      headers: ['id', 'utility', 'effectiveDate', 'baseRatePerUnit', 'archivedAt']
    },
    {
      name: TABS.MONTHLY_BUDGETS,
      headers: ['id', 'month', 'mode', 'electricityBudget', 'waterBudget', 'gasBudget', 'fuelBudget', 'opexBudget', 'totalBudget', 'isConfigured', 'updatedAt', 'updatedBy']
    },
    {
      name: TABS.AUDIT_LOG,
      headers: ['id', 'timestamp', 'action', 'dataType', 'recordId', 'targetDate', 'previousValue', 'newValue', 'reason', 'userEmail']
    },
    {
      name: TABS.APP_SETTINGS,
      headers: ['key', 'value', 'updatedAt']
    }
  ];

  tabConfigs.forEach(function(config) {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.getRange(1, 1, 1, config.headers.length).setFontWeight('bold').setBackground('#E2E8F0');
      sheet.setFrozenRows(1);
      // Format kolom tanggal/ID sebagai Plain Text agar tidak rusak oleh Google Sheets
      sheet.getRange(2, 1, sheet.getMaxRows() - 1, 2).setNumberFormat('@');
    }
  });

  // Hapus "Sheet1" default jika ada dan kosong
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return 'Database 10 Tab Berhasil Dibuat!';
}

/**
 * 2. Handle GET Requests (Membaca Data ke Web)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getDashboard';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'getReadings') {
      const sheet = ss.getSheetByName(TABS.DAILY_READINGS);
      return sendJsonResponse({ success: true, readings: getSheetDataAsObjects(sheet) });
    }

    if (action === 'getAudit') {
      const sheet = ss.getSheetByName(TABS.AUDIT_LOG);
      const logs = getSheetDataAsObjects(sheet);
      return sendJsonResponse({ success: true, logs: logs.reverse() });
    }

    if (action === 'getBudgets') {
      const sheet = ss.getSheetByName(TABS.MONTHLY_BUDGETS);
      return sendJsonResponse({ success: true, budgets: getSheetDataAsObjects(sheet) });
    }

    // Default: getDashboard
    const readingsSheet = ss.getSheetByName(TABS.DAILY_READINGS);
    const fuelSheet = ss.getSheetByName(TABS.FUEL_USAGE);
    const opexSheet = ss.getSheetByName(TABS.OPERATING_EXPENSES);
    const budgetSheet = ss.getSheetByName(TABS.MONTHLY_BUDGETS);

    return sendJsonResponse({
      success: true,
      readings: getSheetDataAsObjects(readingsSheet),
      fuels: getSheetDataAsObjects(fuelSheet),
      opex: getSheetDataAsObjects(opexSheet),
      budgets: getSheetDataAsObjects(budgetSheet),
    });
  } catch (error) {
    return sendJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * 3. Handle POST Requests (Menyimpan / Mengubah Data dari Web)
 */
function doPost(e) {
  // Gunakan LockService agar tidak terjadi benturan saat simpan bersamaan
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || (e && e.parameter && e.parameter.action);

    // 1. Simpan Pembacaan Meter (Listrik, Air, Gas)
    if (action === 'saveReading') {
      const sheet = ss.getSheetByName(TABS.DAILY_READINGS);
      const rowId = 'read-' + body.date;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = getNowWita();

      const eVal = (body.electricityMeter !== undefined && body.electricityMeter !== null && body.electricityMeter !== '') ? body.electricityMeter : '';
      const wVal = (body.waterMeter !== undefined && body.waterMeter !== null && body.waterMeter !== '') ? body.waterMeter : '';
      const gVal = (body.gasMeter !== undefined && body.gasMeter !== null && body.gasMeter !== '') ? body.gasMeter : '';

      if (existingRow > 0) {
        sheet.getRange(existingRow, 3).setValue(eVal);
        sheet.getRange(existingRow, 4).setValue(wVal);
        sheet.getRange(existingRow, 5).setValue(gVal);
        sheet.getRange(existingRow, 6).setValue(timestamp);
      } else {
        sheet.appendRow([
          rowId,
          String(body.date),
          eVal,
          wVal,
          gVal,
          timestamp,
          body.recordedBy || 'Supervisor Operasional',
          'FALSE',
          1
        ]);
      }

      logAudit(ss, {
        action: existingRow > 0 ? 'UPDATE' : 'CREATE',
        dataType: 'meter',
        recordId: rowId,
        targetDate: body.date,
        previousValue: existingRow > 0 ? 'Pembaruan Data' : 'Data Baru',
        newValue: JSON.stringify({ listrik: eVal, air: wVal, gas: gVal }),
        reason: body.reason || 'Input rutin mandiri supervisor',
        userEmail: 'supervisor@agranusavilla.com'
      });

      return sendJsonResponse({ success: true, message: 'Data meter berhasil disimpan di Google Sheets' });
    }

    // 2. Simpan Fuel Solar Harian
    if (action === 'saveFuel') {
      const sheet = ss.getSheetByName(TABS.FUEL_USAGE);
      const rowId = 'fuel-' + body.date;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = getNowWita();
      const solarLiters = (body.solarLiters !== undefined && body.solarLiters !== null && body.solarLiters !== '') ? Number(body.solarLiters) : 0;

      if (existingRow > 0) {
        sheet.getRange(existingRow, 3).setValue(solarLiters);
        sheet.getRange(existingRow, 4).setValue(body.gensetStatus || 'Running Test Normal');
        sheet.getRange(existingRow, 6).setValue(timestamp);
      } else {
        sheet.appendRow([
          rowId,
          String(body.date),
          solarLiters,
          body.gensetStatus || 'Running Test Normal',
          timestamp,
          'Supervisor Operasional',
          'FALSE',
          1
        ]);
      }
      return sendJsonResponse({ success: true, message: 'Fuel solar tersimpan di Google Sheets' });
    }

    // 3. Simpan Pengeluaran Operasional (Opex Kasir)
    if (action === 'saveOpex') {
      const sheet = ss.getSheetByName(TABS.OPERATING_EXPENSES);
      const rowId = 'opex-' + body.date;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = getNowWita();
      const opexVal = (body.totalAmount !== undefined && body.totalAmount !== null && body.totalAmount !== '') ? Number(body.totalAmount) : 0;

      if (existingRow > 0) {
        sheet.getRange(existingRow, 3).setValue(opexVal);
        sheet.getRange(existingRow, 4).setValue(timestamp);
      } else {
        sheet.appendRow([
          rowId,
          String(body.date),
          opexVal,
          timestamp,
          'Supervisor Operasional',
          'FALSE',
          1
        ]);
      }
      return sendJsonResponse({ success: true, message: 'Opex kasir tersimpan di Google Sheets' });
    }

    // 4. Simpan Pagu Anggaran
    if (action === 'saveBudget') {
      let sheet = ss.getSheetByName(TABS.MONTHLY_BUDGETS);
      if (!sheet) {
        sheet = ss.insertSheet(TABS.MONTHLY_BUDGETS);
        sheet.appendRow(['id', 'month', 'mode', 'electricityBudget', 'waterBudget', 'gasBudget', 'fuelBudget', 'opexBudget', 'totalBudget', 'isConfigured', 'updatedAt', 'updatedBy']);
        sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#E2E8F0');
        sheet.setFrozenRows(1);
      }
      const rowId = 'budget-' + body.month;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = getNowWita();

      const rowValues = [
        rowId,
        String(body.month),
        body.mode || 'sum_categories',
        Number(body.electricityBudget) || 0,
        Number(body.waterBudget) || 0,
        Number(body.gasBudget) || 0,
        Number(body.fuelBudget) || 0,
        Number(body.opexBudget) || 0,
        Number(body.totalBudget) || 0,
        'TRUE',
        timestamp,
        'Supervisor Operasional'
      ];

      if (existingRow > 0) {
        sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      return sendJsonResponse({ success: true, message: 'Anggaran bulanan tersimpan di Google Sheets' });
    }

    // 5. Soft Delete / Arsip Catatan
    if (action === 'archive') {
      const tabName = body.dataType === 'readings' ? TABS.DAILY_READINGS :
                      body.dataType === 'fuel' ? TABS.FUEL_USAGE : TABS.OPERATING_EXPENSES;
      const sheet = ss.getSheetByName(tabName);
      const rowIndex = findRowIndexById(sheet, body.recordId);
      if (rowIndex > 0) {
        const isArchivedCol = tabName === TABS.OPERATING_EXPENSES ? 5 : 8;
        sheet.getRange(rowIndex, isArchivedCol).setValue('TRUE');

        logAudit(ss, {
          action: 'SOFT_DELETE',
          dataType: body.dataType,
          recordId: body.recordId,
          targetDate: body.targetDate || '',
          previousValue: 'Active',
          newValue: 'Archived (Soft Delete)',
          reason: body.reason || 'Pengarsipan oleh Supervisor',
          userEmail: 'supervisor@agranusavilla.com'
        });
      }
      return sendJsonResponse({ success: true, message: 'Data berhasil diarsipkan' });
    }

    return sendJsonResponse({ success: false, error: 'Aksi tidak dikenal: ' + action });
  } catch (error) {
    return sendJsonResponse({ success: false, error: error.toString() });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Helper: Ambil data baris menjadi list of Object (Kebal bug tanggal UTC)
 */
function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const rows = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Jika Google Sheets mengubah cell jadi Date, ubah kembali jadi string tanggal lokal
      if (val instanceof Date) {
        val = Utilities.formatDate(val, TZ, headers[j] === 'date' ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss");
      }
      obj[headers[j]] = val;
    }
    // Filter soft delete
    if (obj.isArchived !== 'TRUE' && obj.isArchived !== true) {
      results.push(obj);
    }
  }

  return results;
}

/**
 * Helper: Cari baris berdasarkan ID secara aman (Anti crash getLastRow < 1)
 */
function findRowIndexById(sheet, id) {
  if (!sheet) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(1, 1, lastRow, 1).getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(id).trim()) {
      return i + 1; // 1-based index
    }
  }
  return -1;
}

/**
 * Helper: Catat audit trail ke tab AuditLog
 */
function logAudit(ss, entry) {
  const sheet = ss.getSheetByName(TABS.AUDIT_LOG);
  if (!sheet) return;
  sheet.appendRow([
    'aud-' + new Date().getTime(),
    getNowWita(),
    entry.action,
    entry.dataType,
    entry.recordId,
    entry.targetDate,
    entry.previousValue,
    entry.newValue,
    entry.reason,
    entry.userEmail
  ]);
}

/**
 * Helper: Waktu sekarang format WITA (Asia/Makassar)
 */
function getNowWita() {
  return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Helper: Response JSON
 */
function sendJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
