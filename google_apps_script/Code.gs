/**
 * ==============================================================================
 * MYlog — Google Apps Script Backend (Web App)
 * Google Sheets sebagai Database Utama (Single Source of Truth)
 * Vila: Agranusa Signature Villa
 * ==============================================================================
 * 
 * CARA PAKAI:
 * 1. Buka Google Sheet Anda.
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode default, lalu tempelkan seluruh kode ini.
 * 4. Klik ikon "Simpan" (Ctrl+S).
 * 5. Jalankan fungsi "setupDatabaseSheets()" sekali untuk membuat seluruh tab otomatis.
 * 6. Klik "Deploy" -> "Deployment baru" (New deployment) -> Pilih jenis "Aplikasi web" (Web app).
 * 7. Pada "Siapa yang memiliki akses", pilih "Siapa saja" (Anyone).
 * 8. Klik "Deploy", izinkan akses akun Google Anda, lalu salin URL Web App yang dihasilkan.
 * 9. Tempel URL tersebut ke konfigurasi Vercel / file .env.local:
 *    GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

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
 * Inisialisasi otomatis tab-tab database bila belum ada
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
      name: TABS.TARIFF_CONFIG,
      headers: ['id', 'utility', 'effectiveDate', 'baseRatePerUnit', 'monthlyFixedCost', 'percentageComponentRate', 'percentageBasis', 'isConfigured']
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
    }
  });

  return 'Database 10 Tab Berhasil Dibuat!';
}

/**
 * Handle GET Requests (Read from Sheets)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getDashboard';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'getReadings') {
      const sheet = ss.getSheetByName(TABS.DAILY_READINGS);
      const data = getSheetDataAsObjects(sheet);
      return sendJsonResponse({ success: true, readings: data });
    }

    if (action === 'getAudit') {
      const sheet = ss.getSheetByName(TABS.AUDIT_LOG);
      const data = getSheetDataAsObjects(sheet);
      return sendJsonResponse({ success: true, logs: data.reverse() });
    }

    if (action === 'getBudgets') {
      const sheet = ss.getSheetByName(TABS.MONTHLY_BUDGETS);
      const data = getSheetDataAsObjects(sheet);
      return sendJsonResponse({ success: true, budgets: data });
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
 * Handle POST Requests (Write/Update to Sheets)
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || e.parameter.action;

    // 1. Simpan Pembacaan Meter (Listrik, Air, Gas)
    if (action === 'saveReading') {
      const sheet = ss.getSheetByName(TABS.DAILY_READINGS);
      const rowId = 'read-' + body.date;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = new Date().toISOString();

      if (existingRow > 0) {
        // Overwrite existing row
        sheet.getRange(existingRow, 3).setValue(body.electricityMeter || '');
        sheet.getRange(existingRow, 4).setValue(body.waterMeter || '');
        sheet.getRange(existingRow, 5).setValue(body.gasMeter || '');
        sheet.getRange(existingRow, 6).setValue(timestamp);
      } else {
        // Append new row
        sheet.appendRow([
          rowId,
          body.date,
          body.electricityMeter || '',
          body.waterMeter || '',
          body.gasMeter || '',
          timestamp,
          body.recordedBy || 'Supervisor Operasional',
          'FALSE',
          1
        ]);
      }

      // Log to AuditLog
      logAudit(ss, {
        action: existingRow > 0 ? 'UPDATE' : 'CREATE',
        dataType: 'meter',
        recordId: rowId,
        targetDate: body.date,
        previousValue: existingRow > 0 ? 'Updated' : 'None',
        newValue: JSON.stringify({ e: body.electricityMeter, w: body.waterMeter, g: body.gasMeter }),
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
      const timestamp = new Date().toISOString();

      if (existingRow > 0) {
        sheet.getRange(existingRow, 3).setValue(body.solarLiters || 0);
        sheet.getRange(existingRow, 4).setValue(body.gensetStatus || 'Running Test');
        sheet.getRange(existingRow, 6).setValue(timestamp);
      } else {
        sheet.appendRow([
          rowId,
          body.date,
          body.solarLiters || 0,
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
      const timestamp = new Date().toISOString();

      if (existingRow > 0) {
        sheet.getRange(existingRow, 3).setValue(body.totalAmount || 0);
        sheet.getRange(existingRow, 4).setValue(timestamp);
      } else {
        sheet.appendRow([
          rowId,
          body.date,
          body.totalAmount || 0,
          timestamp,
          'Supervisor Operasional',
          'FALSE',
          1
        ]);
      }
      return sendJsonResponse({ success: true, message: 'Opex tersimpan di Google Sheets' });
    }

    // 4. Simpan Pagu Anggaran
    if (action === 'saveBudget') {
      const sheet = ss.getSheetByName(TABS.MONTHLY_BUDGETS);
      const rowId = 'budget-' + body.month;
      const existingRow = findRowIndexById(sheet, rowId);
      const timestamp = new Date().toISOString();

      const rowValues = [
        rowId,
        body.month,
        body.mode || 'sum_categories',
        body.electricityBudget || 0,
        body.waterBudget || 0,
        body.gasBudget || 0,
        body.fuelBudget || 0,
        body.opexBudget || 0,
        body.totalBudget || 0,
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
        // Kolom isArchived
        const isArchivedCol = tabName === TABS.OPERATING_EXPENSES ? 6 : 8;
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
      return sendJsonResponse({ success: true, message: 'Data diarsipkan (Soft Delete)' });
    }

    return sendJsonResponse({ success: false, error: 'Aksi tidak dikenal: ' + action });
  } catch (error) {
    return sendJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Helper: Ambil seluruh data baris menjadi list of Object
 */
function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    // Filter soft delete
    if (obj.isArchived !== 'TRUE' && obj.isArchived !== true) {
      results.push(obj);
    }
  }

  return results;
}

/**
 * Helper: Cari indeks baris berdasarkan kolom ID (Kolom 1)
 */
function findRowIndexById(sheet, id) {
  if (!sheet) return -1;
  const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
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
    new Date().toISOString(),
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
 * Helper: Response JSON
 */
function sendJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
