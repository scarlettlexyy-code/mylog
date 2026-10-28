import { NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';

export async function GET() {
  const session = getAuthenticatedSession();
  return NextResponse.json({
    authenticated: true,
    user: session,
    loginDisabled: true,
  });
}

export async function POST() {
  const session = getAuthenticatedSession();
  return NextResponse.json({
    success: true,
    user: session,
  });
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
  });
}
