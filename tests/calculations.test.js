/**
 * MYlog — Business Logic & Formula Unit Tests
 * Run with: node --test tests/calculations.test.js
 * Strictly validates all PRD Section 10 & 12 mathematical edge cases.
 */

const test = require('node:test');
const assert = require('node:assert');

// Pure formula functions ported directly for direct node test runner validation
function calculateMeterConsumption(newMeter, prevMeter, isResetCycle = false, newBaselineMeter = 0) {
  if (isResetCycle) {
    if (newMeter < newBaselineMeter) {
      return { consumption: 0, isValid: false, errorMessage: 'New meter below baseline' };
    }
    return { consumption: parseFloat((newMeter - newBaselineMeter).toFixed(3)), isValid: true };
  }
  if (newMeter < prevMeter) {
    return { consumption: 0, isValid: false, errorMessage: 'New meter lower than previous' };
  }
  return { consumption: parseFloat((newMeter - prevMeter).toFixed(3)), isValid: true };
}

function calculateComparisonDelta(current, previous) {
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

  if (previous === 0) {
    if (current === 0) {
      return {
        currentValue: 0,
        previousValue: 0,
        deltaNominal: 0,
        deltaPercent: 0,
        isBaselineZero: true,
        statusLabel: 'Tetap',
      };
    }
    return {
      currentValue: current,
      previousValue: 0,
      deltaNominal: deltaNominal,
      deltaPercent: null,
      isBaselineZero: true,
      statusLabel: deltaNominal > 0 ? 'Naik' : 'Turun',
    };
  }

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

  const rawPercent = (deltaNominal / previous) * 100;
  const deltaPercent = parseFloat(rawPercent.toFixed(1));

  let statusLabel = 'Tetap';
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

function evaluateSpikeAlert(currentCost, baselineCost, percentThreshold, nominalThreshold) {
  if (baselineCost === null || baselineCost === undefined) {
    return { isSpike: false, status: 'insufficient_data' };
  }

  const nominalChange = currentCost - baselineCost;

  if (baselineCost === 0) {
    return { isSpike: nominalChange >= nominalThreshold, status: 'baseline_zero' };
  }

  const percentChange = (nominalChange / baselineCost) * 100;
  const isSpike = percentChange >= percentThreshold && nominalChange >= nominalThreshold;

  return { isSpike, percentChange, nominalChange };
}

function calculateBudgetUtilization(spent, budget) {
  if (!budget || budget <= 0) {
    return { percentUsed: null, status: 'not_set' };
  }
  const percentUsed = parseFloat(((spent / budget) * 100).toFixed(1));
  let status = 'safe';
  if (percentUsed >= 100) status = 'exceeded_100';
  else if (percentUsed >= 80) status = 'warning_80';
  return { percentUsed, status };
}

// ============================================================================
// Test Suites
// ============================================================================

test('10.1 Meter Consumption: Normal interval subtraction', () => {
  const res = calculateMeterConsumption(14892.0, 14708.0);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.consumption, 184.0);
});

test('10.1 Meter Consumption: Lower reading is rejected without reset cycle', () => {
  const res = calculateMeterConsumption(14700.0, 14708.0);
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.consumption, 0);
});

test('10.1 Meter Consumption: Reset cycle accepts new baseline', () => {
  const res = calculateMeterConsumption(50.5, 14708.0, true, 10.0);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.consumption, 40.5);
});

test('10.4 Opex Variance: Standard positive delta (+Rp and +%)', () => {
  const delta = calculateComparisonDelta(1720000, 1450000);
  assert.strictEqual(delta.deltaNominal, 270000);
  assert.strictEqual(delta.deltaPercent, 18.6);
  assert.strictEqual(delta.statusLabel, 'Naik');
});

test('10.4 Opex Variance: Standard negative delta (-Rp and -%)', () => {
  const delta = calculateComparisonDelta(1000000, 1250000);
  assert.strictEqual(delta.deltaNominal, -250000);
  assert.strictEqual(delta.deltaPercent, -20.0);
  assert.strictEqual(delta.statusLabel, 'Turun');
});

test('10.4 Opex Variance: Zero baseline shows nominal diff but null percent', () => {
  const delta = calculateComparisonDelta(500000, 0);
  assert.strictEqual(delta.deltaNominal, 500000);
  assert.strictEqual(delta.deltaPercent, null);
  assert.strictEqual(delta.isBaselineZero, true);
});

test('10.4 Opex Variance: Current zero with positive baseline yields -100%', () => {
  const delta = calculateComparisonDelta(0, 750000);
  assert.strictEqual(delta.deltaNominal, -750000);
  assert.strictEqual(delta.deltaPercent, -100.0);
  assert.strictEqual(delta.statusLabel, 'Turun');
});

test('10.4 Opex Variance: Missing previous record returns Data belum cukup', () => {
  const delta = calculateComparisonDelta(1720000, null);
  assert.strictEqual(delta.statusLabel, 'Data belum cukup');
  assert.strictEqual(delta.deltaPercent, null);
});

test('12. Dual Spike Alert: Triggers ONLY if BOTH percent AND nominal exceed threshold', () => {
  // Electricity: 20% AND Rp 500,000
  // Case A: Both exceeded (+24.5% and +Rp 620,000) -> SPIKE
  const spikeBoth = evaluateSpikeAlert(3150000, 2530000, 20, 500000);
  assert.strictEqual(spikeBoth.isSpike, true);

  // Case B: Percent exceeded (+50%), but nominal too small (+Rp 50,000) -> NOT a spike
  const smallNominal = evaluateSpikeAlert(150000, 100000, 20, 500000);
  assert.strictEqual(smallNominal.isSpike, false);

  // Case C: Nominal exceeded (+Rp 600,000), but percent too small (+6%) -> NOT a spike
  const smallPercent = evaluateSpikeAlert(10600000, 10000000, 20, 500000);
  assert.strictEqual(smallPercent.isSpike, false);
});

test('10.5 Budget Utilization: 80% warning and 100% exceeded thresholds', () => {
  // Safe (<80%)
  const safe = calculateBudgetUtilization(34200000, 50000000);
  assert.strictEqual(safe.percentUsed, 68.4);
  assert.strictEqual(safe.status, 'safe');

  // Warning (>=80%)
  const warning = calculateBudgetUtilization(42000000, 50000000);
  assert.strictEqual(warning.percentUsed, 84.0);
  assert.strictEqual(warning.status, 'warning_80');

  // Exceeded (>=100%)
  const exceeded = calculateBudgetUtilization(52000000, 50000000);
  assert.strictEqual(exceeded.percentUsed, 104.0);
  assert.strictEqual(exceeded.status, 'exceeded_100');
});
