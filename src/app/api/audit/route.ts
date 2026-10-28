import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'all';

  const logs = await getAuditLogs();
  return NextResponse.json({
    total: logs.length,
    logs,
  });
}
