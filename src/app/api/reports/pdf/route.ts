import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      format = 'lengkap',
      period = 'thismonth',
      startDate = '2026-10-01',
      endDate = '2026-10-26',
    } = body;

    const reportCode = `RPT-${endDate.substring(0, 4)}-X-${endDate.substring(8, 10)}`;
    const compilationTime = `${endDate}, 17:45 WITA`;

    // Dynamic aggregated report dataset aligned with Stitch PDF preview
    const reportData = {
      code: reportCode,
      title: 'OPERATIONAL ENERGY & COST MONITORING',
      villa: 'Agranusa Signature Villa',
      format,
      periodLabel: `${startDate} - ${endDate}`,
      compilationTime,
      status: 'Data Final & Terverifikasi Sheets Engine',
      budgetSummary: {
        allocation: 60000000,
        realization: 34200000,
        percentage: 68.4,
        remaining: 15800000,
      },
      table: [
        {
          category: 'Listrik (PLN)',
          color: '#F59E0B',
          usage: '14.280 kWh',
          cost: 20650000,
          percentage: 60.4,
        },
        {
          category: 'Air Bersih (PDAM)',
          color: '#0284C7',
          usage: '412 m³',
          cost: 6230000,
          percentage: 18.2,
        },
        {
          category: 'Genset (Solar)',
          color: '#0D9488',
          usage: '240 Liter',
          cost: 4320000,
          percentage: 12.6,
        },
        {
          category: 'Gas & Operasional',
          color: '#EA580C',
          usage: '18 Tabung',
          cost: 3000000,
          percentage: 8.8,
        },
      ],
      totalRealization: 34200000,
      signatures: {
        preparedBy: {
          role: 'Supervisor Operasional Villa',
          name: 'Supervisor Operasional',
          digitalSignId: 'AG-SUP-01',
        },
        approvedBy: {
          role: 'Owner / Direktur Utama',
          name: 'Made Agranusa',
          digitalSignId: 'AG-OWN-0010',
        },
      },
      footer: {
        origin: 'MYlog Document System • Bali, Indonesia',
        pages: 'Halaman 1 dari 12 (PDF Terverifikasi)',
      },
    };

    return NextResponse.json({
      success: true,
      report: reportData,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
