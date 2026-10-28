import { NextRequest, NextResponse } from 'next/server';
import { softDeleteRecord } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dataType,
      recordId,
      reason = 'Pengarsipan catatan lampau (soft delete)',
      userEmail = 'wayan.sudarma@agranusavilla.com',
    } = body;

    if (!dataType || !recordId) {
      return NextResponse.json({ error: 'dataType and recordId are required' }, { status: 400 });
    }

    await softDeleteRecord(dataType, recordId, userEmail, reason);

    return NextResponse.json({
      success: true,
      message: 'Catatan berhasil diarsipkan (soft delete) sesuai PRD Bagian 13.1 & 14',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
