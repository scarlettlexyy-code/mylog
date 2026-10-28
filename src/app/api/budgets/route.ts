import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyBudget, saveMonthlyBudget } from '@/lib/sheets';
import { MonthlyBudget } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') || '2026-10';
  const budget = await getMonthlyBudget(month);
  return NextResponse.json({ budget });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      month,
      mode = 'sum_categories',
      electricityBudget = 0,
      waterBudget = 0,
      gasBudget = 0,
      fuelBudget = 0,
      opexBudget = 0,
      totalBudget,
      userEmail = 'owner@agranusavilla.com',
    } = body;

    if (!month) {
      return NextResponse.json({ error: 'Periode bulan (YYYY-MM) wajib diisi' }, { status: 400 });
    }

    const calculatedTotal = mode === 'sum_categories'
      ? electricityBudget + waterBudget + gasBudget + fuelBudget + opexBudget
      : totalBudget;

    const budgetPayload: MonthlyBudget = {
      id: `budget-${month}`,
      month,
      mode,
      electricityBudget,
      waterBudget,
      gasBudget,
      fuelBudget,
      opexBudget,
      totalBudget: calculatedTotal,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail,
    };

    const saved = await saveMonthlyBudget(budgetPayload, userEmail);

    return NextResponse.json({
      success: true,
      message: `Pagu anggaran bulan ${month} berhasil disimpan sesuai PRD Bagian 12`,
      budget: saved,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
