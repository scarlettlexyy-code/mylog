import { NextResponse } from 'next/server';
import { getTariffs } from '@/lib/sheets';

export async function GET() {
  const tariffs = await getTariffs();
  return NextResponse.json({ tariffs });
}
