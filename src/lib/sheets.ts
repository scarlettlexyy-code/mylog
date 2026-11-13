/**
 * MYlog — Google Sheets API Integration Service
 * Dual Support:
 * 1. Google Apps Script Web App URL (Easiest, free, 1-click deployment from Sheets)
 * 2. Official Google Sheets API v4 via Service Account
 * 3. Safe fallback in-memory store
 */

import { google } from 'googleapis';
import {
  AuditLogEntry,
  FuelReading,
  MeterCycleReset,
  MeterReading,
  MonthlyBudget,
  OperatingExpenseReading,
  TariffRate,
} from './types';

export const SHEETS_TABS = {
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
} as const;

/**
 * Returns authenticated Google Sheets client or null if not configured.
 */
export function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!email || !privateKey || !spreadsheetId) {
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

/**
 * Fast server-side in-memory cache for Apps Script responses (45s TTL)
 * Massively speeds up page transitions (from 4000ms down to < 2ms)
 */
let appsScriptCache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL_MS = 45 * 1000; // 45 seconds

export function clearAppsScriptCache() {
  appsScriptCache = {};
}

/**
 * Helper: Communicate with Google Apps Script Web App Endpoint
 */
async function callAppsScript(action: string, payload?: any) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) return null;

  try {
    if (payload) {
      // Invalidate cache immediately on any write / mutation
      clearAppsScriptCache();

      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
        cache: 'no-store',
        redirect: 'follow',
      });
      return await res.json();
    } else {
      // Check cache for GET requests to achieve sub-millisecond responses
      const now = Date.now();
      const cached = appsScriptCache[action];
      if (cached && cached.expiry > now) {
        return cached.data;
      }

      const res = await fetch(`${scriptUrl}?action=${action}`, {
        cache: 'no-store',
        redirect: 'follow',
      });
      const data = await res.json();
      if (data && data.success) {
        appsScriptCache[action] = { data, expiry: now + CACHE_TTL_MS };
      }
      return data;
    }
  } catch (err) {
    console.error('Error contacting Google Apps Script Web App:', err);
    return null;
  }
}

// ============================================================================
// In-Memory Fallback Store (Baseline Demo / Local Development)
// ============================================================================

let memoryMeterReadings: MeterReading[] = [
  {
    id: 'read-2026-10-24',
    date: '2026-10-24',
    electricityMeter: 14524.0,
    waterMeter: 3091.0,
    gasMeter: 925.6,
    recordedAt: '2026-10-24T18:30:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
  {
    id: 'read-2026-10-25',
    date: '2026-10-25',
    electricityMeter: 14708.0,
    waterMeter: 3105.5,
    gasMeter: 933.8,
    recordedAt: '2026-10-25T18:35:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 2,
  },
  {
    id: 'read-2026-10-26',
    date: '2026-10-26',
    electricityMeter: 14892.0,
    waterMeter: 3120.0,
    gasMeter: 942.0,
    recordedAt: '2026-10-26T18:42:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
];

let memoryFuelReadings: FuelReading[] = [
  {
    id: 'fuel-2026-10-24',
    date: '2026-10-24',
    solarLiters: 0,
    gensetStatus: 'Standby 0 Liter (Idle)',
    recordedAt: '2026-10-24T18:30:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
  {
    id: 'fuel-2026-10-25',
    date: '2026-10-25',
    solarLiters: 20,
    gensetStatus: 'Running Test 1.0 Jam',
    recordedAt: '2026-10-25T18:35:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
  {
    id: 'fuel-2026-10-26',
    date: '2026-10-26',
    solarLiters: 35,
    gensetStatus: 'Running Test 1.5 Jam',
    recordedAt: '2026-10-26T18:42:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
];

let memoryOpexReadings: OperatingExpenseReading[] = [
  {
    id: 'opex-2026-10-24',
    date: '2026-10-24',
    totalAmount: 915500,
    recordedAt: '2026-10-24T18:30:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
  {
    id: 'opex-2026-10-25',
    date: '2026-10-25',
    totalAmount: 1450000,
    recordedAt: '2026-10-25T18:35:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
  {
    id: 'opex-2026-10-26',
    date: '2026-10-26',
    totalAmount: 1720000,
    recordedAt: '2026-10-26T18:42:00+08:00',
    recordedBy: 'Supervisor Operasional',
    isArchived: false,
    version: 1,
  },
];

let memoryTariffs: Record<string, TariffRate> = {
  electricity: {
    id: 'tar-elec',
    utility: 'electricity',
    effectiveDate: '2026-01-01',
    baseRatePerUnit: 2005, // Rp 2.005 / kWh
    monthlyFixedCost: 0,
    percentageComponentRate: 0.07, // 7% Pajak Penerangan Jalan (PPJ)
    percentageBasis: 'variable',
    isConfigured: true,
  },
  water: {
    id: 'tar-water',
    utility: 'water',
    effectiveDate: '2026-01-01',
    baseRatePerUnit: 18862, // Rp 18.862 / m³
    monthlyFixedCost: 0,
    percentageComponentRate: 0,
    percentageBasis: 'variable',
    isConfigured: true,
  },
  gas: {
    id: 'tar-gas',
    utility: 'gas',
    effectiveDate: '2026-01-01',
    baseRatePerUnit: 15000,
    monthlyFixedCost: 0,
    percentageComponentRate: 0,
    percentageBasis: 'variable',
    isConfigured: true,
  },
  fuel: {
    id: 'tar-fuel',
    utility: 'fuel',
    effectiveDate: '2026-01-01',
    baseRatePerUnit: 22000, // Rp 22.000 / Liter
    monthlyFixedCost: 0,
    percentageComponentRate: 0,
    percentageBasis: 'variable',
    isConfigured: true,
  },
};

let memoryBudgets: MonthlyBudget[] = [];

let memoryAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-25T21:04:00+08:00',
    action: 'UPDATE',
    dataType: 'electricity',
    recordId: 'read-2026-10-25',
    targetDate: '2026-10-25',
    previousValue: '14.700 kWh',
    newValue: '14.708 kWh',
    reason: 'Koreksi salah catat digit akhir meteran gardu PLN',
    userEmail: 'supervisor@agranusavilla.com',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-26T18:42:00+08:00',
    action: 'CREATE',
    dataType: 'opex',
    recordId: 'opex-2026-10-26',
    targetDate: '2026-10-26',
    previousValue: 'None',
    newValue: 'Rp 1.720.000',
    reason: 'Input kas harian operasional',
    userEmail: 'supervisor@agranusavilla.com',
  },
];

let memoryMeterCycles: MeterCycleReset[] = [];

// ============================================================================
// Data Access Methods
// ============================================================================

export async function getMeterReadings(): Promise<MeterReading[]> {
  // Option 1: Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript('getReadings');
    if (res?.success && Array.isArray(res.readings)) {
      return res.readings.map((r: any) => ({
        id: r.id || '',
        date: r.date || '',
        electricityMeter: r.electricityMeter != null && r.electricityMeter !== '' ? parseFloat(r.electricityMeter) : null,
        waterMeter: r.waterMeter != null && r.waterMeter !== '' ? parseFloat(r.waterMeter) : null,
        gasMeter: r.gasMeter != null && r.gasMeter !== '' ? parseFloat(r.gasMeter) : null,
        recordedAt: r.recordedAt || '',
        recordedBy: r.recordedBy || 'Supervisor',
        isArchived: r.isArchived === 'TRUE' || r.isArchived === true,
        version: r.version ? parseInt(r.version, 10) : 1,
      }));
    }
  }

  // Option 2: Google Sheets API v4
  const client = getGoogleSheetsClient();
  if (client) {
    try {
      const res = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.spreadsheetId,
        range: `${SHEETS_TABS.DAILY_READINGS}!A2:H`,
      });
      const rows = res.data.values || [];
      return rows
        .map((row) => ({
          id: row[0] || '',
          date: row[1] || '',
          electricityMeter: row[2] ? parseFloat(row[2]) : null,
          waterMeter: row[3] ? parseFloat(row[3]) : null,
          gasMeter: row[4] ? parseFloat(row[4]) : null,
          recordedAt: row[5] || '',
          recordedBy: row[6] || '',
          isArchived: row[7] === 'TRUE',
          version: row[8] ? parseInt(row[8], 10) : 1,
        }))
        .filter((r) => !r.isArchived);
    } catch (err) {
      console.error('Google Sheets API error, using memory fallback:', err);
    }
  }

  // Option 3: Fallback Memory
  return memoryMeterReadings.filter((r) => !r.isArchived);
}

export async function saveMeterReading(
  reading: Omit<MeterReading, 'id' | 'recordedAt' | 'version' | 'isArchived' | 'recordedBy'> & { recordedBy?: string },
  userEmail: string = 'supervisor@agranusavilla.com',
  reason?: string
): Promise<MeterReading> {
  const existingIdx = memoryMeterReadings.findIndex((r) => r.date === reading.date);
  const isUpdate = existingIdx >= 0;
  const prevRecord = isUpdate ? memoryMeterReadings[existingIdx] : null;

  const newRecord: MeterReading = {
    id: prevRecord?.id || `read-${reading.date}`,
    date: reading.date,
    electricityMeter: reading.electricityMeter,
    waterMeter: reading.waterMeter,
    gasMeter: reading.gasMeter,
    recordedAt: new Date().toISOString(),
    recordedBy: userEmail,
    isArchived: false,
    version: isUpdate ? (prevRecord?.version || 1) + 1 : 1,
  };

  // Update memory
  if (isUpdate) {
    memoryMeterReadings[existingIdx] = newRecord;
  } else {
    memoryMeterReadings.push(newRecord);
  }

  // 1. Send to Apps Script Web App
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript('saveReading', {
      date: newRecord.date,
      electricityMeter: newRecord.electricityMeter,
      waterMeter: newRecord.waterMeter,
      gasMeter: newRecord.gasMeter,
      recordedBy: userEmail,
      reason: reason || 'Input harian supervisor',
    });
  }

  // 2. Or Send to Google Sheets API v4
  const client = getGoogleSheetsClient();
  if (client) {
    try {
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: `${SHEETS_TABS.DAILY_READINGS}!A:I`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newRecord.id,
              newRecord.date,
              newRecord.electricityMeter,
              newRecord.waterMeter,
              newRecord.gasMeter,
              newRecord.recordedAt,
              newRecord.recordedBy,
              newRecord.isArchived ? 'TRUE' : 'FALSE',
              newRecord.version,
            ],
          ],
        },
      });
    } catch (e) {
      console.error('Google Sheets API append error:', e);
    }
  }

  return newRecord;
}

export async function getFuelReadings(): Promise<FuelReading[]> {
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript('getDashboard');
    if (res?.success && Array.isArray(res.fuels)) {
      return res.fuels.map((f: any) => ({
        id: f.id || '',
        date: f.date || '',
        solarLiters: f.solarLiters != null && f.solarLiters !== '' ? parseFloat(f.solarLiters) : 0,
        gensetStatus: f.gensetStatus || 'Running Test Normal',
        recordedAt: f.recordedAt || '',
        recordedBy: f.recordedBy || 'Supervisor',
        isArchived: f.isArchived === 'TRUE' || f.isArchived === true,
        version: f.version ? parseInt(f.version, 10) : 1,
      }));
    }
  }
  return memoryFuelReadings.filter((f) => !f.isArchived);
}

export async function saveFuelReading(
  fuel: Omit<FuelReading, 'id' | 'recordedAt' | 'version' | 'isArchived' | 'recordedBy'> & { recordedBy?: string },
  userEmail: string = 'supervisor@agranusavilla.com'
): Promise<FuelReading> {
  const existingIdx = memoryFuelReadings.findIndex((r) => r.date === fuel.date);
  const newRecord: FuelReading = {
    id: `fuel-${fuel.date}`,
    date: fuel.date,
    solarLiters: fuel.solarLiters,
    gensetStatus: fuel.gensetStatus || 'Running Test Normal',
    recordedAt: new Date().toISOString(),
    recordedBy: userEmail,
    isArchived: false,
    version: existingIdx >= 0 ? memoryFuelReadings[existingIdx].version + 1 : 1,
  };

  if (existingIdx >= 0) {
    memoryFuelReadings[existingIdx] = newRecord;
  } else {
    memoryFuelReadings.push(newRecord);
  }

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript('saveFuel', {
      date: newRecord.date,
      solarLiters: newRecord.solarLiters,
      gensetStatus: newRecord.gensetStatus,
    });
  }

  return newRecord;
}

export async function getOperatingExpenses(): Promise<OperatingExpenseReading[]> {
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript('getDashboard');
    if (res?.success && Array.isArray(res.opex)) {
      return res.opex.map((o: any) => ({
        id: o.id || '',
        date: o.date || '',
        totalAmount: o.totalAmount != null && o.totalAmount !== '' ? parseInt(o.totalAmount, 10) : 0,
        recordedAt: o.recordedAt || '',
        recordedBy: o.recordedBy || 'Supervisor',
        isArchived: o.isArchived === 'TRUE' || o.isArchived === true,
        version: o.version ? parseInt(o.version, 10) : 1,
      }));
    }
  }
  return memoryOpexReadings.filter((o) => !o.isArchived);
}

export async function saveOperatingExpense(
  opex: Omit<OperatingExpenseReading, 'id' | 'recordedAt' | 'version' | 'isArchived' | 'recordedBy'> & { recordedBy?: string },
  userEmail: string = 'supervisor@agranusavilla.com'
): Promise<OperatingExpenseReading> {
  const existingIdx = memoryOpexReadings.findIndex((r) => r.date === opex.date);
  const newRecord: OperatingExpenseReading = {
    id: `opex-${opex.date}`,
    date: opex.date,
    totalAmount: opex.totalAmount,
    recordedAt: new Date().toISOString(),
    recordedBy: userEmail,
    isArchived: false,
    version: existingIdx >= 0 ? memoryOpexReadings[existingIdx].version + 1 : 1,
  };

  if (existingIdx >= 0) {
    memoryOpexReadings[existingIdx] = newRecord;
  } else {
    memoryOpexReadings.push(newRecord);
  }

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript('saveOpex', {
      date: newRecord.date,
      totalAmount: newRecord.totalAmount,
    });
  }

  return newRecord;
}

export async function getTariffs(): Promise<Record<string, TariffRate>> {
  return memoryTariffs;
}

export async function getMonthlyBudget(month: string): Promise<MonthlyBudget | null> {
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    let res = await callAppsScript('getBudgets');
    if (!res?.success || !Array.isArray(res?.budgets)) {
      res = await callAppsScript('getDashboard');
    }
    if (res?.success && Array.isArray(res.budgets)) {
      const found = res.budgets.find((b: any) => String(b.month).trim() === String(month).trim());
      if (found) {
        return {
          id: found.id || `budget-${found.month}`,
          month: found.month,
          mode: found.mode || 'sum_categories',
          electricityBudget: Number(found.electricityBudget) || 0,
          waterBudget: Number(found.waterBudget) || 0,
          gasBudget: Number(found.gasBudget) || 0,
          fuelBudget: Number(found.fuelBudget) || 0,
          opexBudget: Number(found.opexBudget) || 0,
          totalBudget: Number(found.totalBudget) || 0,
          isConfigured: true,
          updatedAt: found.updatedAt || '',
          updatedBy: found.updatedBy || 'Supervisor Operasional',
        };
      }
    }
  }
  const budget = memoryBudgets.find((b) => b.month === month);
  return budget || null;
}

export async function saveMonthlyBudget(budget: MonthlyBudget, userEmail: string = 'supervisor@agranusavilla.com'): Promise<MonthlyBudget> {
  const existingIdx = memoryBudgets.findIndex((b) => b.month === budget.month);
  const updated: MonthlyBudget = {
    ...budget,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
  };

  if (existingIdx >= 0) {
    memoryBudgets[existingIdx] = updated;
  } else {
    memoryBudgets.push(updated);
  }

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript('saveBudget', budget);
  }

  return updated;
}

export async function recordAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<AuditLogEntry> {
  const auditEntry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  memoryAuditLogs.unshift(auditEntry);
  return auditEntry;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  let rawLogs: any[] = [];
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript('getAudit');
    if (res?.success && Array.isArray(res.logs) && res.logs.length > 0) {
      rawLogs = res.logs;
    }
  }

  // Also fetch real operational records to guarantee complete and visible audit trail
  const [meterList, fuelList, opexList] = await Promise.all([
    getMeterReadings().catch(() => []),
    getFuelReadings().catch(() => []),
    getOperatingExpenses().catch(() => []),
  ]);

  // Set of existing record + date combinations from rawLogs
  const existingRecordKeys = new Set(
    rawLogs.map((r: any) => {
      const recId = String(r.recordId || r.RecordId || r.id || '').trim();
      const tDate = String(r.targetDate || r.TargetDate || r.date || '').split('T')[0].trim();
      return `${recId}_${tDate}`;
    })
  );

  const synthesizedLogs: any[] = [];

  // 1. Synthesize from Meter Readings (DailyReadings)
  for (const m of meterList) {
    if (!m.date) continue;
    const key = `read-${m.date}_${m.date}`;
    if (!existingRecordKeys.has(key)) {
      const eVal = m.electricityMeter != null ? m.electricityMeter : '';
      const wVal = m.waterMeter != null ? m.waterMeter : '';
      const gVal = m.gasMeter != null ? m.gasMeter : '';
      synthesizedLogs.push({
        id: `aud-meter-${m.date}`,
        timestamp: m.recordedAt || `${m.date}T18:00:00+08:00`,
        action: m.version && m.version > 1 ? 'UPDATE' : 'CREATE',
        dataType: 'meter',
        recordId: `read-${m.date}`,
        targetDate: m.date,
        previousValue: m.version && m.version > 1 ? 'Pembaruan Data' : 'Data Baru',
        newValue: JSON.stringify({ listrik: eVal, air: wVal, gas: gVal }),
        reason: 'Pencatatan konsumsi harian meter villa',
        userEmail: m.recordedBy || 'supervisor@agranusavilla.com',
      });
    }
  }

  // 2. Synthesize from Fuel Usage (FuelUsage)
  for (const f of fuelList) {
    if (!f.date) continue;
    const key = `fuel-${f.date}_${f.date}`;
    if (!existingRecordKeys.has(key)) {
      synthesizedLogs.push({
        id: `aud-fuel-${f.date}`,
        timestamp: f.recordedAt || `${f.date}T18:00:00+08:00`,
        action: f.version && f.version > 1 ? 'UPDATE' : 'CREATE',
        dataType: 'fuel',
        recordId: `fuel-${f.date}`,
        targetDate: f.date,
        previousValue: f.version && f.version > 1 ? 'Pembaruan Fuel' : 'Data Baru',
        newValue: `Solar: ${f.solarLiters || 0} L (${f.gensetStatus || 'Running Test Normal'})`,
        reason: 'Pencatatan konsumsi bahan bakar genset',
        userEmail: f.recordedBy || 'supervisor@agranusavilla.com',
      });
    }
  }

  // 3. Synthesize from Operating Expenses (OperatingExpenses)
  for (const o of opexList) {
    if (!o.date) continue;
    const key = `opex-${o.date}_${o.date}`;
    if (!existingRecordKeys.has(key)) {
      synthesizedLogs.push({
        id: `aud-opex-${o.date}`,
        timestamp: o.recordedAt || `${o.date}T18:00:00+08:00`,
        action: o.version && o.version > 1 ? 'UPDATE' : 'CREATE',
        dataType: 'opex',
        recordId: `opex-${o.date}`,
        targetDate: o.date,
        previousValue: o.version && o.version > 1 ? 'Pembaruan Kasir' : 'Data Baru',
        newValue: `Total: ${formatRupiah(o.totalAmount || 0)}`,
        reason: 'Pencatatan kas operasional harian kasir',
        userEmail: o.recordedBy || 'supervisor@agranusavilla.com',
      });
    }
  }

  const combined = [...rawLogs, ...synthesizedLogs];
  if (combined.length === 0) {
    combined.push(...memoryAuditLogs);
  }

  return combined
    .filter((r) => r && typeof r === 'object')
    .map((r, idx) => {
      // Find key case-insensitively
      const getKey = (name: string) => {
        const lower = name.toLowerCase();
        for (const k of Object.keys(r)) {
          if (k.toLowerCase() === lower) return r[k];
        }
        return undefined;
      };

      const id = getKey('id') || `aud-${idx}`;
      let timestamp = getKey('timestamp') || getKey('waktu') || getKey('recordedAt') || '';
      if (timestamp instanceof Date) timestamp = timestamp.toISOString();

      const rawAction = String(getKey('action') || getKey('aksi') || 'UPDATE').toUpperCase();
      const action = ['CREATE', 'UPDATE', 'SOFT_DELETE', 'RESTORE', 'CYCLE_RESET'].includes(rawAction)
        ? rawAction
        : 'UPDATE';

      const dataType = String(getKey('dataType') || getKey('datatype') || getKey('type') || 'meter').toLowerCase();
      const recordId = String(getKey('recordId') || getKey('record_id') || '');

      let targetDate = getKey('targetDate') || getKey('target_date') || getKey('date') || getKey('tanggal') || '';
      if (typeof targetDate === 'string' && targetDate.includes('T')) {
        targetDate = targetDate.split('T')[0];
      }

      const prev = getKey('previousValue') !== undefined ? getKey('previousValue') : getKey('previous_value');
      const next = getKey('newValue') !== undefined ? getKey('newValue') : getKey('new_value');
      const reason = getKey('reason') || getKey('alasan') || getKey('keterangan') || '';
      const userEmail = getKey('userEmail') || getKey('user_email') || getKey('user') || 'supervisor@agranusavilla.com';

      return {
        id: String(id),
        timestamp: String(timestamp || ''),
        action: action as any,
        dataType: dataType as any,
        recordId: String(recordId || ''),
        targetDate: String(targetDate || ''),
        previousValue: typeof prev === 'object' && prev !== null ? JSON.stringify(prev) : String(prev ?? ''),
        newValue: typeof next === 'object' && next !== null ? JSON.stringify(next) : String(next ?? ''),
        reason: String(reason || ''),
        userEmail: String(userEmail || ''),
      };
    })
    // Filter out completely empty ghost rows
    .filter((l) => l.action && (l.recordId || l.targetDate || l.newValue || l.previousValue))
    // Sort descending: newest activity on top
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.targetDate || 0).getTime();
      const timeB = new Date(b.timestamp || b.targetDate || 0).getTime();
      return timeB - timeA;
    });
}

export async function recordMeterCycle(
  reset: Omit<MeterCycleReset, 'id' | 'recordedAt'>
): Promise<MeterCycleReset> {
  const record: MeterCycleReset = {
    id: `cycle-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    ...reset,
  };

  memoryMeterCycles.push(record);
  return record;
}

export async function softDeleteRecord(
  dataType: string,
  recordId: string,
  userEmail: string = 'supervisor@agranusavilla.com',
  reason: string = 'Arsip oleh Supervisor'
): Promise<{ success: boolean }> {
  if (dataType === 'readings') {
    const item = memoryMeterReadings.find((r) => r.id === recordId);
    if (item) item.isArchived = true;
  } else if (dataType === 'fuel') {
    const item = memoryFuelReadings.find((r) => r.id === recordId);
    if (item) item.isArchived = true;
  } else if (dataType === 'opex') {
    const item = memoryOpexReadings.find((r) => r.id === recordId);
    if (item) item.isArchived = true;
  }

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    callAppsScript('archive', { dataType, recordId, reason });
  }

  return { success: true };
}
