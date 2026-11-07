/**
 * MYlog — Calculations & Business Logic Engine
 * Strictly follows PRD v1.3 Section 10 & Section 12 specifications.
 */

import { ComparisonDelta, SpikeAlert, TariffRate, UtilityType } from './types';

/**
 * 10.1 Meter Reading Consumption Interval
 * Lower numbers are strictly rejected unless a reset cycle is provided.
 */
export function calculateMeterConsumption(
  newMeter: number,
  prevMeter: number,
  isResetCycle: boolean = false,
  newBaselineMeter: number = 0
): { consumption: number; isValid: boolean; errorMessage?: string } {
  if (isResetCycle) {
    if (newMeter < newBaselineMeter) {
      return {
        consumption: 0,
        isValid: false,
        errorMessage: `Angka meter baru (${newMeter}) tidak boleh lebih rendah dari baseline (${newBaselineMeter}).`,
      };
    }
    return {
      consumption: parseFloat((newMeter - newBaselineMeter).toFixed(3)),
      isValid: true,
    };
  }

  if (newMeter < prevMeter) {
    return {
      consumption: 0,
      isValid: false,
      errorMessage: `Nilai meter (${newMeter}) tidak boleh lebih rendah dari meter sebelumnya (${prevMeter}). Gunakan Reset/Ganti Meter bila fisik diganti.`,
    };
  }

  return {
    consumption: parseFloat((newMeter - prevMeter).toFixed(3)),
    isValid: true,
  };
}

/**
 * 10.3 Energy Cost Calculation
 * Variable Cost + Fixed Daily Allocation + Percentage Component (tax/surcharge)
 */
export function calculateEnergyCost(
  consumption: number,
  tariff: TariffRate,
  daysInMonth: number = 31
): {
  variableCost: number;
  fixedCostDaily: number;
  percentageComponentCost: number;
  totalCost: number;
  isComplete: boolean;
} {
  if (!tariff.isConfigured || tariff.baseRatePerUnit <= 0) {
    return {
      variableCost: 0,
      fixedCostDaily: 0,
      percentageComponentCost: 0,
      totalCost: 0,
      isComplete: false,
    };
  }

  const variableCost = Math.round(consumption * tariff.baseRatePerUnit);
  const fixedCostDaily = tariff.monthlyFixedCost > 0 
    ? Math.round(tariff.monthlyFixedCost / daysInMonth) 
    : 0;

  let percentageBasisVal = 0;
  if (tariff.percentageBasis === 'variable') {
    percentageBasisVal = variableCost;
  } else if (tariff.percentageBasis === 'fixed') {
    percentageBasisVal = fixedCostDaily;
  } else {
    percentageBasisVal = variableCost + fixedCostDaily;
  }

  const rateMultiplier = tariff.percentageComponentRate > 1
    ? tariff.percentageComponentRate / 100
    : tariff.percentageComponentRate;

  const percentageComponentCost = tariff.percentageComponentRate > 0
    ? Math.round(percentageBasisVal * rateMultiplier)
    : 0;

  const totalCost = variableCost + fixedCostDaily + percentageComponentCost;

  return {
    variableCost,
    fixedCostDaily,
    percentageComponentCost,
    totalCost,
    isComplete: true,
  };
}

/**
 * 10.4 Nominal Difference & Percentage Variance Calculation
 * Comprehensive handling for 0 baseline, -100% drops, and missing comparisons.
 */
export function calculateComparisonDelta(
  current: number,
  previous: number | null | undefined
): ComparisonDelta {
  if (previous === null || previous === undefined || isNaN(previous)) {
    return {
      currentValue: current,
      previousValue: null,
      deltaNominal: current,
      deltaPercent: null,
      isBaselineZero: false,
      statusLabel: 'Data belum cukup',
    };
  }

  const deltaNominal = current - previous;

  // Case: previous is strictly 0
  if (previous === 0) {
    if (current === 0) {
      return {
        currentValue: current,
        previousValue: 0,
        deltaNominal: 0,
        deltaPercent: 0,
        isBaselineZero: true,
        statusLabel: 'Tetap',
      };
    }
    // Cannot compute division by zero -> show — (basis 0)
    return {
      currentValue: current,
      previousValue: 0,
      deltaNominal: deltaNominal,
      deltaPercent: null,
      isBaselineZero: true,
      statusLabel: deltaNominal > 0 ? 'Naik' : 'Turun',
    };
  }

  // Case: previous > 0, current == 0 -> -100%
  if (current === 0 && previous > 0) {
    return {
      currentValue: 0,
      previousValue: previous,
      deltaNominal: deltaNominal,
      deltaPercent: -100.0,
      isBaselineZero: false,
      statusLabel: 'Turun',
    };
  }

  // Standard percentage calculation rounded to 1 decimal place for UI
  const rawPercent = (deltaNominal / previous) * 100;
  const deltaPercent = parseFloat(rawPercent.toFixed(1));

  let statusLabel: 'Naik' | 'Turun' | 'Tetap' = 'Tetap';
  if (deltaNominal > 0) statusLabel = 'Naik';
  else if (deltaNominal < 0) statusLabel = 'Turun';

  return {
    currentValue: current,
    previousValue: previous,
    deltaNominal,
    deltaPercent,
    isBaselineZero: false,
    statusLabel,
  };
}

/**
 * 10.5 Budget Utilization
 * Safe threshold at 80%, hard warning at >= 100%
 */
export function calculateBudgetUtilization(
  spent: number,
  budget: number | null | undefined
): {
  percentUsed: number | null;
  remaining: number;
  status: 'safe' | 'warning_80' | 'exceeded_100' | 'not_set';
  statusText: string;
} {
  if (budget === null || budget === undefined || budget <= 0) {
    return {
      percentUsed: null,
      remaining: 0,
      status: 'not_set',
      statusText: 'Anggaran belum ditetapkan',
    };
  }

  const rawPercent = (spent / budget) * 100;
  const percentUsed = parseFloat(rawPercent.toFixed(1));
  const remaining = budget - spent;

  if (percentUsed >= 100) {
    return {
      percentUsed,
      remaining,
      status: 'exceeded_100',
      statusText: `${percentUsed}% • Melebihi Anggaran`,
    };
  } else if (percentUsed >= 80) {
    return {
      percentUsed,
      remaining,
      status: 'warning_80',
      statusText: `${percentUsed}% • Waspada (≥ 80%)`,
    };
  } else {
    return {
      percentUsed,
      remaining,
      status: 'safe',
      statusText: `${percentUsed}% • Aman`,
    };
  }
}

/**
 * 12. Dual-Condition Spike Alert Engine
 * Triggers ONLY if BOTH percent change AND nominal change exceed thresholds.
 */
export const DEFAULT_SPIKE_THRESHOLDS: Record<
  'electricity' | 'water' | 'gas' | 'fuel',
  { percentThreshold: number; nominalThreshold: number; label: string }
> = {
  electricity: { percentThreshold: 20, nominalThreshold: 500000, label: 'Listrik (PLN)' },
  water: { percentThreshold: 20, nominalThreshold: 100000, label: 'Air PDAM / Deep Well' },
  gas: { percentThreshold: 20, nominalThreshold: 100000, label: 'Gas Sentral Kitchen' },
  fuel: { percentThreshold: 20, nominalThreshold: 250000, label: 'Fuel Genset (Solar)' },
};

export function evaluateSpikeAlert(
  utility: 'electricity' | 'water' | 'gas' | 'fuel',
  currentCost: number,
  baselineCost: number | null,
  date: string
): SpikeAlert {
  const config = DEFAULT_SPIKE_THRESHOLDS[utility];

  if (baselineCost === null || baselineCost === undefined) {
    return {
      id: `alert-${utility}-${date}`,
      date,
      utility,
      utilityLabel: config.label,
      currentCost,
      baselineCost: 0,
      percentChange: null,
      nominalChange: currentCost,
      percentThreshold: config.percentThreshold,
      nominalThreshold: config.nominalThreshold,
      isSpike: false,
      message: 'Data pembanding belum cukup untuk deteksi lonjakan.',
    };
  }

  const nominalChange = currentCost - baselineCost;

  // If baseline is 0, percentage is undefined; PRD 12 says:
  // "Jika baseline valid Rp0, gunakan aturan nominal tanpa persentase."
  if (baselineCost === 0) {
    const isSpike = nominalChange >= config.nominalThreshold;
    return {
      id: `alert-${utility}-${date}`,
      date,
      utility,
      utilityLabel: config.label,
      currentCost,
      baselineCost: 0,
      percentChange: null,
      nominalChange,
      percentThreshold: config.percentThreshold,
      nominalThreshold: config.nominalThreshold,
      isSpike,
      message: isSpike
        ? `Lonjakan ${config.label} terdeteksi: kenaikan nominal Rp ${nominalChange.toLocaleString('id-ID')} melampaui batas Rp ${config.nominalThreshold.toLocaleString('id-ID')} (baseline Rp0).`
        : 'Pemakaian normal.',
    };
  }

  const percentChange = parseFloat(((nominalChange / baselineCost) * 100).toFixed(1));

  // PRD 12 Dual condition requirement:
  // BOTH percent AND nominal must exceed threshold
  const isSpike =
    percentChange >= config.percentThreshold && nominalChange >= config.nominalThreshold;

  const sign = nominalChange >= 0 ? '+' : '';
  const message = isSpike
    ? `Lonjakan ${config.label} Terdeteksi: Kenaikan harian melampaui ambang ganda: ${sign}${percentChange}% (ambang ${config.percentThreshold}%) dan ${sign}Rp ${nominalChange.toLocaleString('id-ID')} (ambang Rp ${config.nominalThreshold.toLocaleString('id-ID')}).`
    : 'Dalam batas aman.';

  return {
    id: `alert-${utility}-${date}`,
    date,
    utility,
    utilityLabel: config.label,
    currentCost,
    baselineCost,
    percentChange,
    nominalChange,
    percentThreshold: config.percentThreshold,
    nominalThreshold: config.nominalThreshold,
    isSpike,
    message,
  };
}

/**
 * Currency Formatter (IDR)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

/**
 * Formats a raw numeric string to Indonesian thousands separator format (e.g. "1500000" -> "1.500.000")
 */
export function formatThousands(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return parseInt(clean, 10).toLocaleString('id-ID');
}

/**
 * Parses a formatted string back to raw number (e.g. "1.500.000" -> 1500000)
 */
export function parseThousands(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  const clean = String(val).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Decimal number formatter with Indonesian comma decimal separator
 */
export function formatDecimal(val: number | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return val.toFixed(decimals).replace('.', ',');
}
