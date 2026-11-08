import { NextRequest, NextResponse } from 'next/server';
import { getMeterReadings, recordMeterCycle, saveMeterReading } from '@/lib/sheets';
import { calculateMeterConsumption } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetDate = searchParams.get('date');
  const readings = await getMeterReadings();
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));

  if (targetDate) {
    const existing = sorted.find((r) => r.date === targetDate);
    const previous = [...sorted].reverse().find((r) => r.date < targetDate);
    return NextResponse.json({ readings: sorted, existing, previous });
  }

  return NextResponse.json({ readings: sorted });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      electricityMeter,
      waterMeter,
      gasMeter,
      isResetCycle,
      resetUtility,
      resetBaseline,
      resetReason,
      userEmail = 'supervisor@agranusavilla.com',
      reason,
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const readings = await getMeterReadings();
    const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
    const previousReading = [...sorted].reverse().find((r) => r.date < date);

    // Validasi nilai pemakaian harian (angka tidak boleh negatif)
    if (electricityMeter != null && parseFloat(electricityMeter) < 0) {
      return NextResponse.json({ error: 'Nilai pemakaian listrik tidak boleh negatif' }, { status: 422 });
    }
    if (waterMeter != null && parseFloat(waterMeter) < 0) {
      return NextResponse.json({ error: 'Nilai konsumsi air tidak boleh negatif' }, { status: 422 });
    }
    if (gasMeter != null && parseFloat(gasMeter) < 0) {
      return NextResponse.json({ error: 'Nilai pemakaian gas tidak boleh negatif' }, { status: 422 });
    }

    // If a physical meter replacement cycle was executed
    if (isResetCycle && resetUtility && resetBaseline != null) {
      await recordMeterCycle({
        utility: resetUtility,
        resetDate: date,
        oldMeterFinal: previousReading ? (previousReading as any)[`${resetUtility}Meter`] || 0 : 0,
        newMeterBaseline: resetBaseline,
        reason: resetReason || 'Pergantian fisik meteran gardu',
        recordedBy: userEmail,
      });
    }

    const saved = await saveMeterReading(
      {
        date,
        electricityMeter: electricityMeter != null ? parseFloat(electricityMeter) : null,
        waterMeter: waterMeter != null ? parseFloat(waterMeter) : null,
        gasMeter: gasMeter != null ? parseFloat(gasMeter) : null,
        recordedBy: userEmail,
      },
      userEmail,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Data meteran berhasil disimpan ke database Google Sheets',
      reading: saved,
    });
  } catch (error) {
    console.error('Error saving reading:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
