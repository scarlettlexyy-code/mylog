import { NextRequest, NextResponse } from 'next/server';
import {
  getFuelReadings,
  getMeterReadings,
  getMonthlyBudget,
  getOperatingExpenses,
  getTariffs,
} from '@/lib/sheets';
import {
  calculateBudgetUtilization,
  calculateComparisonDelta,
  calculateEnergyCost,
  calculateMeterConsumption,
  evaluateSpikeAlert,
} from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = searchParams.get('date') || todayStr;
    const month = targetDate.substring(0, 7); // e.g. "2026-11"

    const [readings, fuels, opexs, tariffs, budget] = await Promise.all([
      getMeterReadings(),
      getFuelReadings(),
      getOperatingExpenses(),
      getTariffs(),
      getMonthlyBudget(month),
    ]);

    // Sort by date ascending
    const sortedReadings = [...readings].sort((a, b) => a.date.localeCompare(b.date));
    const sortedFuels = [...fuels].sort((a, b) => a.date.localeCompare(b.date));
    const sortedOpex = [...opexs].sort((a, b) => a.date.localeCompare(b.date));

    // Target day and previous day records
    const todayReading = sortedReadings.find((r) => r.date === targetDate);
    const readingIdx = sortedReadings.findIndex((r) => r.date === targetDate);
    const prevReading = readingIdx > 0 
      ? sortedReadings[readingIdx - 1] 
      : (sortedReadings.length > 0 && !todayReading ? sortedReadings[sortedReadings.length - 1] : null);

    const todayFuel = sortedFuels.find((f) => f.date === targetDate);
    const fuelIdx = sortedFuels.findIndex((f) => f.date === targetDate);
    const prevFuel = fuelIdx > 0 ? sortedFuels[fuelIdx - 1] : null;

    const todayOpex = sortedOpex.find((o) => o.date === targetDate);
    const opexIdx = sortedOpex.findIndex((o) => o.date === targetDate);
    const prevOpex = opexIdx > 0 ? sortedOpex[opexIdx - 1] : null;

    // 1. Electricity calculation
    let elecConsumption = 0;
    let elecCost = 0;
    let elecPrevCost = 0;
    let isElecComplete = false;
    if (todayReading?.electricityMeter != null && prevReading?.electricityMeter != null) {
      const elecRes = calculateMeterConsumption(
        todayReading.electricityMeter,
        prevReading.electricityMeter
      );
      if (elecRes.isValid) {
        elecConsumption = elecRes.consumption;
        const costRes = calculateEnergyCost(elecConsumption, tariffs.electricity);
        elecCost = costRes.totalCost;
        isElecComplete = costRes.isComplete;
      }
    }
    if (readingIdx > 1 && sortedReadings[readingIdx - 2]?.electricityMeter != null && prevReading?.electricityMeter != null) {
      const prevRes = calculateMeterConsumption(
        prevReading.electricityMeter,
        sortedReadings[readingIdx - 2].electricityMeter!
      );
      if (prevRes.isValid) {
        elecPrevCost = calculateEnergyCost(prevRes.consumption, tariffs.electricity).totalCost;
      }
    }

    // 2. Water calculation
    let waterConsumption = 0;
    let waterCost = 0;
    let waterPrevCost = 0;
    let isWaterComplete = false;
    if (todayReading?.waterMeter != null && prevReading?.waterMeter != null) {
      const waterRes = calculateMeterConsumption(
        todayReading.waterMeter,
        prevReading.waterMeter
      );
      if (waterRes.isValid) {
        waterConsumption = waterRes.consumption;
        const costRes = calculateEnergyCost(waterConsumption, tariffs.water);
        waterCost = costRes.totalCost;
        isWaterComplete = costRes.isComplete;
      }
    }
    if (readingIdx > 1 && sortedReadings[readingIdx - 2]?.waterMeter != null && prevReading?.waterMeter != null) {
      const prevRes = calculateMeterConsumption(
        prevReading.waterMeter,
        sortedReadings[readingIdx - 2].waterMeter!
      );
      if (prevRes.isValid) {
        waterPrevCost = calculateEnergyCost(prevRes.consumption, tariffs.water).totalCost;
      }
    }

    // 3. Gas calculation
    let gasConsumption = 0;
    let gasCost = 0;
    let gasPrevCost = 0;
    let isGasComplete = false;
    if (todayReading?.gasMeter != null && prevReading?.gasMeter != null) {
      const gasRes = calculateMeterConsumption(
        todayReading.gasMeter,
        prevReading.gasMeter
      );
      if (gasRes.isValid) {
        gasConsumption = gasRes.consumption;
        const costRes = calculateEnergyCost(gasConsumption, tariffs.gas);
        gasCost = costRes.totalCost;
        isGasComplete = costRes.isComplete;
      }
    }
    if (readingIdx > 1 && sortedReadings[readingIdx - 2]?.gasMeter != null && prevReading?.gasMeter != null) {
      const prevRes = calculateMeterConsumption(
        prevReading.gasMeter,
        sortedReadings[readingIdx - 2].gasMeter!
      );
      if (prevRes.isValid) {
        gasPrevCost = calculateEnergyCost(prevRes.consumption, tariffs.gas).totalCost;
      }
    }

    // 4. Fuel calculation
    const solarLiters = todayFuel ? todayFuel.solarLiters : 0;
    const solarCost = calculateEnergyCost(solarLiters, tariffs.fuel).totalCost;
    const isFuelComplete = todayFuel != null;
    const prevSolarLiters = prevFuel ? prevFuel.solarLiters : 0;
    const prevSolarCost = calculateEnergyCost(prevSolarLiters, tariffs.fuel).totalCost;

    // 5. Operating Expenses
    const opexAmount = todayOpex ? todayOpex.totalAmount : 0;
    const isOpexComplete = todayOpex != null;
    const prevOpexAmount = prevOpex ? prevOpex.totalAmount : null;
    const opexDelta = calculateComparisonDelta(opexAmount, prevOpexAmount);

    // Energy Subtotal vs Total Expenditure
    const energySubtotal = elecCost + waterCost + gasCost + solarCost;
    const grandTotal = energySubtotal + opexAmount;

    // Completeness
    const completeness = [
      isElecComplete,
      isWaterComplete,
      isGasComplete,
      isFuelComplete,
      isOpexComplete,
    ];
    const completedCount = completeness.filter(Boolean).length;
    const isFullyComplete = completedCount === 5;

    // Period deltas
    const elecCostDelta = calculateComparisonDelta(elecCost, elecPrevCost || null);
    const waterCostDelta = calculateComparisonDelta(waterCost, waterPrevCost || null);
    const gasCostDelta = calculateComparisonDelta(gasCost, gasPrevCost || null);
    const fuelCostDelta = calculateComparisonDelta(solarCost, prevSolarCost || null);
    const totalDailyDelta = calculateComparisonDelta(
      grandTotal,
      (elecPrevCost + waterPrevCost + gasPrevCost + prevSolarCost + (prevOpexAmount || 0)) || null
    );

    // Spike Alerts
    const alerts = [
      evaluateSpikeAlert('electricity', elecCost, elecPrevCost || null, targetDate),
      evaluateSpikeAlert('water', waterCost, waterPrevCost || null, targetDate),
      evaluateSpikeAlert('gas', gasCost, gasPrevCost || null, targetDate),
      evaluateSpikeAlert('fuel', solarCost, prevSolarCost || null, targetDate),
    ];
    const activeSpikes = alerts.filter((a) => a.isSpike);

    // Real Month-to-date calculation for this month
    let mtdElecConsumption = 0;
    let mtdWaterConsumption = 0;
    let mtdGasConsumption = 0;

    const monthReadings = sortedReadings.filter((r) => r.date.startsWith(month));
    for (let i = 0; i < monthReadings.length; i++) {
      const cur = monthReadings[i];
      const cIdx = sortedReadings.findIndex((r) => r.id === cur.id);
      if (cIdx > 0) {
        const pr = sortedReadings[cIdx - 1];
        if (cur.electricityMeter != null && pr.electricityMeter != null && cur.electricityMeter >= pr.electricityMeter) {
          mtdElecConsumption += (cur.electricityMeter - pr.electricityMeter);
        }
        if (cur.waterMeter != null && pr.waterMeter != null && cur.waterMeter >= pr.waterMeter) {
          mtdWaterConsumption += (cur.waterMeter - pr.waterMeter);
        }
        if (cur.gasMeter != null && pr.gasMeter != null && cur.gasMeter >= pr.gasMeter) {
          mtdGasConsumption += (cur.gasMeter - pr.gasMeter);
        }
      }
    }

    const monthFuels = sortedFuels.filter((f) => f.date.startsWith(month));
    const mtdFuelLiters = monthFuels.reduce((sum, f) => sum + (f.solarLiters || 0), 0);

    const monthOpex = sortedOpex.filter((o) => o.date.startsWith(month));
    const mtdOpexAmount = monthOpex.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const mtdElecCost = Math.round(mtdElecConsumption * (tariffs.electricity?.baseRatePerUnit || 1450));
    const mtdWaterCost = Math.round(mtdWaterConsumption * (tariffs.water?.baseRatePerUnit || 7500));
    const mtdGasCost = Math.round(mtdGasConsumption * (tariffs.gas?.baseRatePerUnit || 15000));
    const mtdFuelCost = Math.round(mtdFuelLiters * (tariffs.fuel?.baseRatePerUnit || 15000));
    const mtdEnergyCost = mtdElecCost + mtdWaterCost + mtdGasCost + mtdFuelCost;
    const mtdTotalSpent = mtdEnergyCost + mtdOpexAmount;

    const activeTotalBudget = budget?.totalBudget || 50000000;
    const budgetUtilization = calculateBudgetUtilization(mtdTotalSpent, activeTotalBudget);

    return NextResponse.json({
      targetDate,
      completeness: {
        count: completedCount,
        total: 5,
        isFullyComplete,
        checklist: {
          listrik: isElecComplete,
          air: isWaterComplete,
          gas: isGasComplete,
          solar: isFuelComplete,
          opex: isOpexComplete,
        },
      },
      currentPeriodSummary: {
        totalElectricityConsumption: mtdElecConsumption,
        totalElectricityCost: mtdElecCost,
        totalWaterConsumption: mtdWaterConsumption,
        totalWaterCost: mtdWaterCost,
        totalGasConsumption: mtdGasConsumption,
        totalGasCost: mtdGasCost,
        totalFuel: mtdFuelLiters,
        totalFuelCost: mtdFuelCost,
        totalOpex: mtdOpexAmount,
        totalEnergyCost: mtdEnergyCost,
        grandTotalCost: mtdTotalSpent,
      },
      today: {
        hasData: !!(todayReading || todayFuel || todayOpex),
        date: targetDate,
        electricity: {
          currentMeter: todayReading?.electricityMeter ?? null,
          previousMeter: prevReading?.electricityMeter ?? null,
          consumption: elecConsumption,
          unit: 'kWh',
          cost: elecCost,
          delta: elecCostDelta,
        },
        water: {
          currentMeter: todayReading?.waterMeter ?? null,
          previousMeter: prevReading?.waterMeter ?? null,
          consumption: waterConsumption,
          unit: 'm³',
          cost: waterCost,
          delta: waterCostDelta,
        },
        gas: {
          currentMeter: todayReading?.gasMeter ?? null,
          previousMeter: prevReading?.gasMeter ?? null,
          consumption: gasConsumption,
          unit: 'm³',
          cost: gasCost,
          delta: gasCostDelta,
        },
        fuel: {
          liters: solarLiters,
          cost: solarCost,
          gensetStatus: todayFuel?.gensetStatus || 'Running Test Normal',
          delta: fuelCostDelta,
        },
        opex: {
          totalAmount: opexAmount,
          previousAmount: prevOpexAmount,
          delta: opexDelta,
        },
        energySubtotal: energySubtotal,
        grandTotal: grandTotal,
        grandTotalDelta: totalDailyDelta,
      },
      budget: {
        month,
        totalBudget: activeTotalBudget,
        spentMtd: mtdTotalSpent,
        remaining: Math.max(0, activeTotalBudget - mtdTotalSpent),
        utilization: budgetUtilization,
        categories: {
          electricity: {
            budget: budget?.electricityBudget || 15000000,
            spent: mtdElecCost,
            percent: (budget?.electricityBudget || 0) > 0 ? (mtdElecCost / budget!.electricityBudget) * 100 : 0,
            status: mtdElecCost > (budget?.electricityBudget || 15000000) ? 'Bahaya' : 'Aman',
          },
          water: {
            budget: budget?.waterBudget || 4500000,
            spent: mtdWaterCost,
            percent: (budget?.waterBudget || 0) > 0 ? (mtdWaterCost / budget!.waterBudget) * 100 : 0,
            status: mtdWaterCost > (budget?.waterBudget || 4500000) ? 'Bahaya' : 'Aman',
          },
          gas: {
            budget: budget?.gasBudget || 3500000,
            spent: mtdGasCost,
            percent: (budget?.gasBudget || 0) > 0 ? (mtdGasCost / budget!.gasBudget) * 100 : 0,
            status: mtdGasCost > (budget?.gasBudget || 3500000) ? 'Bahaya' : 'Aman',
          },
          fuel: {
            budget: budget?.fuelBudget || 7000000,
            spent: mtdFuelCost,
            percent: (budget?.fuelBudget || 0) > 0 ? (mtdFuelCost / budget!.fuelBudget) * 100 : 0,
            status: mtdFuelCost > (budget?.fuelBudget || 7000000) ? 'Bahaya' : 'Aman',
          },
          opex: {
            budget: budget?.opexBudget || 20000000,
            spent: mtdOpexAmount,
            percent: (budget?.opexBudget || 0) > 0 ? (mtdOpexAmount / budget!.opexBudget) * 100 : 0,
            status: mtdOpexAmount > (budget?.opexBudget || 20000000) ? 'Bahaya' : 'Aman',
          },
        },
      },
      recentReadings: sortedReadings.slice(-10).reverse(),
      alerts: {
        activeSpikes,
        allEvaluated: alerts,
      },
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
