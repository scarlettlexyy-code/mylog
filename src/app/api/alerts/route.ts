import { NextRequest, NextResponse } from 'next/server';
import { evaluateSpikeAlert } from '@/lib/calculations';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get('date') || '2026-10-26';

  // Evaluate default spike alerts for electricity, water, gas, fuel
  // Electricity spike simulated from Stitch mockup (+24.5% & +Rp 620.000)
  const alerts = [
    {
      ...evaluateSpikeAlert('electricity', 3150000, 2530000, targetDate),
      // Reflecting the Stitch mockup alert card exactly:
      // "Lonjakan Listrik Terdeteksi: Kenaikan harian melampaui ambang ganda: +24,5% (ambang +20%) dan +Rp 620.000 (ambang +Rp 500.000) dibandingkan rata-rata 7 hari villa."
      isSpike: true,
      percentChange: 24.5,
      nominalChange: 620000,
      message: 'Kenaikan harian melampaui ambang ganda: +24,5% (ambang +20%) dan +Rp 620.000 (ambang +Rp 500.000) dibandingkan rata-rata 7 hari villa.',
    },
    evaluateSpikeAlert('water', 108750, 105000, targetDate),
    evaluateSpikeAlert('gas', 123000, 120000, targetDate),
    evaluateSpikeAlert('fuel', 525000, 520000, targetDate),
  ];

  return NextResponse.json({
    date: targetDate,
    activeAlerts: alerts.filter((a) => a.isSpike),
    allAlerts: alerts,
  });
}
