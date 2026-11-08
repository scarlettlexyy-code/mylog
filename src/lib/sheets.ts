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
 * Helper: Communicate with Google Apps Script Web App Endpoint
 */
async function callAppsScript(action: string, payload?: any) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) return null;

  try {
    if (payload) {
      const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
        cache: 'no-store',
        redirect: 'follow',
      });
      return await res.json();
    } else {
      const res = await fetch(`${scriptUrl}?action=${action}`, {
        cache: 'no-store',
        redirect: 'follow',
      });
      return await res.json();
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

let memoryBudgets: MonthlyBudget[] = [
  {
    id: 'budget-2026-11',
    month: '2026-11',
    mode: 'sum_categories',
    electricityBudget: 15000000,
    waterBudget: 4500000,
    gasBudget: 3500000,
    fuelBudget: 7000000,
    opexBudget: 20000000,
    totalBudget: 50000000,
    isConfigured: true,
    updatedAt: '2026-11-01T08:00:00+08:00',
    updatedBy: 'Supervisor Operasional',
  },
  {
    id: 'budget-2026-10',
    month: '2026-10',
    mode: 'sum_categories',
    electricityBudget: 15000000,
    waterBudget: 4500000,
    gasBudget: 3500000,
    fuelBudget: 7000000,
    opexBudget: 20000000,
    totalBudget: 50000000,
    isConfigured: true,
    updatedAt: '2026-10-01T08:00:00+08:00',
    updatedBy: 'Supervisor Operasional',
  },
];

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
    const res = await callAppsScript('getBudgets');
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
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript('getAudit');
    if (res?.success && Array.isArray(res.logs)) {
      return res.logs;
    }
  }
  return memoryAuditLogs;
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
