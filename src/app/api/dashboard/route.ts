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

    // 1. Electricity calculation (Direct daily total consumption)
    let elecConsumption = 0;
    let elecCost = 0;
    let elecPrevCost = 0;
    let isElecComplete = false;
    if (todayReading?.electricityMeter != null) {
      elecConsumption = Number(todayReading.electricityMeter);
      const costRes = calculateEnergyCost(elecConsumption, tariffs.electricity);
      elecCost = costRes.totalCost;
      isElecComplete = true;
    }
    if (prevReading?.electricityMeter != null) {
      elecPrevCost = calculateEnergyCost(Number(prevReading.electricityMeter), tariffs.electricity).totalCost;
    }

    // 2. Water calculation (Direct daily total consumption)
    let waterConsumption = 0;
    let waterCost = 0;
    let waterPrevCost = 0;
    let isWaterComplete = false;
    if (todayReading?.waterMeter != null) {
      waterConsumption = Number(todayReading.waterMeter);
      const costRes = calculateEnergyCost(waterConsumption, tariffs.water);
      waterCost = costRes.totalCost;
      isWaterComplete = true;
    }
    if (prevReading?.waterMeter != null) {
      waterPrevCost = calculateEnergyCost(Number(prevReading.waterMeter), tariffs.water).totalCost;
    }

    // 3. Gas calculation (Direct daily total consumption)
    let gasConsumption = 0;
    let gasCost = 0;
    let gasPrevCost = 0;
    let isGasComplete = false;
    if (todayReading?.gasMeter != null) {
      gasConsumption = Number(todayReading.gasMeter);
      const costRes = calculateEnergyCost(gasConsumption, tariffs.gas);
      gasCost = costRes.totalCost;
      isGasComplete = true;
    }
    if (prevReading?.gasMeter != null) {
      gasPrevCost = calculateEnergyCost(Number(prevReading.gasMeter), tariffs.gas).totalCost;
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

    // Real Month-to-date calculation for this month (Direct daily consumption sum)
    let mtdElecConsumption = 0;
    let mtdWaterConsumption = 0;
    let mtdGasConsumption = 0;

    const monthReadings = sortedReadings.filter((r) => r.date.startsWith(month));
    for (let i = 0; i < monthReadings.length; i++) {
      const cur = monthReadings[i];
      if (cur.electricityMeter != null) {
        mtdElecConsumption += Number(cur.electricityMeter);
      }
      if (cur.waterMeter != null) {
        mtdWaterConsumption += Number(cur.waterMeter);
      }
      if (cur.gasMeter != null) {
        mtdGasConsumption += Number(cur.gasMeter);
      }
    }

    const monthFuels = sortedFuels.filter((f) => f.date.startsWith(month));
    const mtdFuelLiters = monthFuels.reduce((sum, f) => sum + (f.solarLiters || 0), 0);

    const monthOpex = sortedOpex.filter((o) => o.date.startsWith(month));
    const mtdOpexAmount = monthOpex.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const mtdElecCost = calculateEnergyCost(mtdElecConsumption, tariffs.electricity).totalCost;
    const mtdWaterCost = calculateEnergyCost(mtdWaterConsumption, tariffs.water).totalCost;
    const mtdGasCost = calculateEnergyCost(mtdGasConsumption, tariffs.gas).totalCost;
    const mtdFuelCost = calculateEnergyCost(mtdFuelLiters, tariffs.fuel).totalCost;
    const mtdEnergyCost = mtdElecCost + mtdWaterCost + mtdGasCost + mtdFuelCost;
    const mtdTotalSpent = mtdEnergyCost + mtdOpexAmount;

    const activeTotalBudget = budget?.isConfigured 
      ? Number(budget.totalBudget) || 0 
      : (Number(budget?.totalBudget) || 0);
    const budgetUtilization = calculateBudgetUtilization(mtdTotalSpent, activeTotalBudget);

    // Build recent daily expenses across readings, fuels, and opex
    const allDates = Array.from(new Set([
      ...sortedReadings.map((r) => r.date),
      ...sortedFuels.map((f) => f.date),
      ...sortedOpex.map((o) => o.date),
    ])).sort();

    const recentDailyExpenses = allDates.slice(-14).reverse().map((d) => {
      const r = sortedReadings.find((x) => x.date === d);
      const f = sortedFuels.find((x) => x.date === d);
      const o = sortedOpex.find((x) => x.date === d);

      const eCons = r?.electricityMeter != null ? Number(r.electricityMeter) : 0;
      const wCons = r?.waterMeter != null ? Number(r.waterMeter) : 0;
      const gCons = r?.gasMeter != null ? Number(r.gasMeter) : 0;
      const sLiters = f?.solarLiters != null ? Number(f.solarLiters) : 0;
      const opAmt = o?.totalAmount != null ? Number(o.totalAmount) : 0;

      const eCost = calculateEnergyCost(eCons, tariffs.electricity).totalCost;
      const wCost = calculateEnergyCost(wCons, tariffs.water).totalCost;
      const gCost = calculateEnergyCost(gCons, tariffs.gas).totalCost;
      const sCost = calculateEnergyCost(sLiters, tariffs.fuel).totalCost;
      const totalDaily = eCost + wCost + gCost + sCost + opAmt;

      return {
        date: d,
        electricityConsumption: eCons,
        electricityCost: eCost,
        waterConsumption: wCons,
        waterCost: wCost,
        gasConsumption: gCons,
        gasCost: gCost,
        fuelLiters: sLiters,
        fuelCost: sCost,
        opexAmount: opAmt,
        energySubtotal: eCost + wCost + gCost + sCost,
        grandTotal: totalDaily,
      };
    });

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
        isConfigured: !!budget?.isConfigured,
        totalBudget: activeTotalBudget,
        spentMtd: mtdTotalSpent,
        remaining: Math.max(0, activeTotalBudget - mtdTotalSpent),
        utilization: budgetUtilization,
        categories: {
          electricity: {
            budget: Number(budget?.electricityBudget) || 0,
            spent: mtdElecCost,
            percent: (Number(budget?.electricityBudget) || 0) > 0 ? (mtdElecCost / Number(budget!.electricityBudget)) * 100 : 0,
            status: mtdElecCost > (Number(budget?.electricityBudget) || 0) ? 'Bahaya' : 'Aman',
          },
          water: {
            budget: Number(budget?.waterBudget) || 0,
            spent: mtdWaterCost,
            percent: (Number(budget?.waterBudget) || 0) > 0 ? (mtdWaterCost / Number(budget!.waterBudget)) * 100 : 0,
            status: mtdWaterCost > (Number(budget?.waterBudget) || 0) ? 'Bahaya' : 'Aman',
          },
          gas: {
            budget: Number(budget?.gasBudget) || 0,
            spent: mtdGasCost,
            percent: (Number(budget?.gasBudget) || 0) > 0 ? (mtdGasCost / Number(budget!.gasBudget)) * 100 : 0,
            status: mtdGasCost > (Number(budget?.gasBudget) || 0) ? 'Bahaya' : 'Aman',
          },
          fuel: {
            budget: Number(budget?.fuelBudget) || 0,
            spent: mtdFuelCost,
            percent: (Number(budget?.fuelBudget) || 0) > 0 ? (mtdFuelCost / Number(budget!.fuelBudget)) * 100 : 0,
            status: mtdFuelCost > (Number(budget?.fuelBudget) || 0) ? 'Bahaya' : 'Aman',
          },
          opex: {
            budget: Number(budget?.opexBudget) || 0,
            spent: mtdOpexAmount,
            percent: (Number(budget?.opexBudget) || 0) > 0 ? (mtdOpexAmount / Number(budget!.opexBudget)) * 100 : 0,
            status: mtdOpexAmount > (Number(budget?.opexBudget) || 0) ? 'Bahaya' : 'Aman',
          },
        },
      },
      recentDailyExpenses,
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
