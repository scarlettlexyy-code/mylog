import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, clearAppsScriptCache } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get('refresh') === 'true';

  if (refresh) {
    clearAppsScriptCache();
  }

  const logs = await getAuditLogs();
  return NextResponse.json({
    total: logs.length,
    logs,
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
