import { NextResponse } from 'next/server';

export async function GET() {
  const isSheetsConfigured = Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );

  const isAuthConfigured = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_ALLOWED_EMAIL
  );

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MYlog Operational Energy & Cost Monitoring',
    version: '1.3.0',
    villa: 'Agranusa Signature Villa',
    timezone: 'Asia/Makassar (WITA)',
    integrations: {
      googleSheets: {
        status: isSheetsConfigured ? 'connected' : 'unconfigured_fallback_memory',
        description: isSheetsConfigured
          ? 'Tersambung ke Google Sheets API resmi'
          : 'Belum dikonfigurasi (menjalankan memori lokal aman sesuai PRD Bagian 0)',
      },
      googleOAuth: {
        status: isAuthConfigured ? 'configured' : 'unconfigured_dev_mode',
      },
    },
  });
}
