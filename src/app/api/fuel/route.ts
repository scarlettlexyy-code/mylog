import { NextRequest, NextResponse } from 'next/server';
import { getFuelReadings, saveFuelReading } from '@/lib/sheets';

export async function GET() {
  const fuels = await getFuelReadings();
  return NextResponse.json({ fuels });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, solarLiters, gensetStatus, userEmail = 'wayan.sudarma@agranusavilla.com' } = body;

    if (!date || solarLiters == null) {
      return NextResponse.json({ error: 'Tanggal dan volume solar wajib diisi' }, { status: 400 });
    }

    const saved = await saveFuelReading(
      {
        date,
        solarLiters: parseFloat(solarLiters),
        gensetStatus: gensetStatus || 'Running Test Normal',
        recordedBy: userEmail,
      },
      userEmail
    );

    return NextResponse.json({
      success: true,
      message: 'Data kuantitas harian fuel solar berhasil disimpan',
      fuel: saved,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
