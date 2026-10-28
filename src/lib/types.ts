/**
 * MYlog — Operational Energy & Cost Monitoring
 * Core TypeScript Definitions & Domain Models (PRD v1.3 Compliance)
 */

export type UtilityType = 'electricity' | 'water' | 'gas' | 'fuel' | 'opex';

export interface MeterReading {
  id: string;
  date: string; // YYYY-MM-DD (Asia/Makassar)
  electricityMeter: number | null; // kWh
  waterMeter: number | null; // m³
  gasMeter: number | null; // m³
  electricityConsumption?: number | null;
  waterConsumption?: number | null;
  gasConsumption?: number | null;
  recordedAt: string; // ISO 8601
  recordedBy: string;
  isArchived: boolean;
  version: number;
}

export interface FuelReading {
  id: string;
  date: string; // YYYY-MM-DD
  solarLiters: number; // Daily consumed volume in liters (NOT cumulative meter)
  gensetStatus?: string; // e.g. "Running Test 1.5 Jam"
  recordedAt: string;
  recordedBy: string;
  isArchived: boolean;
  version: number;
}

export interface OperatingExpenseReading {
  id: string;
  date: string; // YYYY-MM-DD
  totalAmount: number; // Rupiah (IDR) - strictly total only, NO itemized receipts per PRD 9
  recordedAt: string;
  recordedBy: string;
  isArchived: boolean;
  version: number;
}

export interface MeterCycleReset {
  id: string;
  utility: 'electricity' | 'water' | 'gas';
  resetDate: string;
  oldMeterFinal: number;
  newMeterBaseline: number;
  reason: string;
  recordedBy: string;
  recordedAt: string;
}

export interface TariffRate {
  id: string;
  utility: UtilityType;
  effectiveDate: string; // YYYY-MM-DD
  baseRatePerUnit: number; // e.g. 1450 for electricity kWh, 7500 for water m³, 15000 for gas/fuel
  monthlyFixedCost: number; // Distributed across calendar days
  percentageComponentRate: number; // e.g. 0.1 for 10% tax/service if applicable
  percentageBasis: 'variable' | 'fixed' | 'total';
  isConfigured: boolean; // Flag to indicate if officially configured or awaiting official rates
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM (e.g. "2026-10")
  mode: 'sum_categories' | 'manual_total';
  electricityBudget: number; // IDR
  waterBudget: number;
  gasBudget: number;
  fuelBudget: number;
  opexBudget: number;
  totalBudget: number;
  isConfigured: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SpikeAlert {
  id: string;
  date: string;
  utility: UtilityType;
  utilityLabel: string;
  currentCost: number;
  baselineCost: number;
  percentChange: number | null; // null if baseline 0 or insufficient
  nominalChange: number;
  percentThreshold: number; // e.g., 20%
  nominalThreshold: number; // e.g., Rp 500,000 for electricity
  isSpike: boolean; // TRUE only if BOTH percent AND nominal exceed threshold (PRD 12)
  message: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 (Asia/Makassar)
  action: 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'RESTORE' | 'CYCLE_RESET';
  dataType: UtilityType | 'budget' | 'tariff' | 'meter_cycle';
  recordId: string;
  targetDate: string;
  previousValue: string;
  newValue: string;
  reason: string;
  userEmail: string;
}

export interface DailySummaryItem {
  date: string;
  listrik: {
    meter: number | null;
    prevMeter: number | null;
    consumption: number | null; // kWh
    cost: number;
    status: 'complete' | 'missing' | 'cycle_reset';
  };
  air: {
    meter: number | null;
    prevMeter: number | null;
    consumption: number | null; // m³
    cost: number;
    status: 'complete' | 'missing' | 'cycle_reset';
  };
  gas: {
    meter: number | null;
    prevMeter: number | null;
    consumption: number | null; // m³
    cost: number;
    status: 'complete' | 'missing' | 'cycle_reset';
  };
  solar: {
    liters: number | null;
    cost: number;
    status: 'complete' | 'missing';
    gensetStatus?: string;
  };
  opex: {
    amount: number | null;
    prevAmount: number | null;
    deltaNominal: number | null;
    deltaPercent: number | null;
    status: 'complete' | 'missing';
  };
  energyCostTotal: number;
  totalDailyExpenditure: number; // energyCostTotal + opex
  completenessCount: number; // 0 to 5
  isFullyComplete: boolean;
  isOverwritten: boolean;
}

export interface ComparisonDelta {
  currentValue: number;
  previousValue: number | null;
  deltaNominal: number;
  deltaPercent: number | null; // null if previousValue is null or zero
  isBaselineZero: boolean;
  statusLabel: 'Naik' | 'Turun' | 'Tetap' | 'Data belum cukup';
}

export interface ReportConfig {
  format: 'eksekutif' | 'detail' | 'lengkap';
  period: 'today' | '7days' | 'thismonth' | 'lastmonth' | 'custom';
  startDate: string;
  endDate: string;
}
