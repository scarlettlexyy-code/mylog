import { NextRequest, NextResponse } from 'next/server';
import { getOperatingExpenses, saveOperatingExpense } from '@/lib/sheets';
import { calculateComparisonDelta } from '@/lib/calculations';

export async function GET() {
  const opex = await getOperatingExpenses();
  return NextResponse.json({ opex });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, totalAmount, userEmail = 'wayan.sudarma@agranusavilla.com' } = body;

    if (!date || totalAmount == null) {
      return NextResponse.json({ error: 'Tanggal dan total pengeluaran wajib diisi' }, { status: 400 });
    }

    const numericAmount = typeof totalAmount === 'string'
      ? parseInt(totalAmount.replace(/[^0-9]/g, ''), 10)
      : Math.round(totalAmount);

    const allOpex = await getOperatingExpenses();
    const prevOpex = allOpex
      .sort((a, b) => a.date.localeCompare(b.date))
      .reverse()
      .find((o) => o.date < date);

    const delta = calculateComparisonDelta(numericAmount, prevOpex ? prevOpex.totalAmount : null);

    const saved = await saveOperatingExpense(
      {
        date,
        totalAmount: numericAmount,
      },
      userEmail
    );

    return NextResponse.json({
      success: true,
      message: 'Total pengeluaran operasional harian berhasil dicatat',
      opex: saved,
      delta,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
