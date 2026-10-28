/**
 * MYlog — Authentication & Access Guard
 * Revised: Direct Supervisor Access (No Login Wall / Zero Barrier)
 */

import { NextRequest, NextResponse } from 'next/server';

export interface UserSession {
  email: string;
  name: string;
  picture?: string;
  authenticatedAt: string;
}

export function isAllowedEmail(): boolean {
  return true;
}

export function encodeSession(session: UserSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export function decodeSession(): UserSession {
  return {
    email: 'supervisor@agranusavilla.com',
    name: 'Supervisor Operasional',
    picture: '',
    authenticatedAt: new Date().toISOString(),
  };
}

export function getAuthenticatedSession(): UserSession {
  return {
    email: 'supervisor@agranusavilla.com',
    name: 'Supervisor Operasional',
    picture: '',
    authenticatedAt: new Date().toISOString(),
  };
}

export function requireAuth(): { session: UserSession } {
  return {
    session: getAuthenticatedSession(),
  };
}

export function attachSessionCookie(response: NextResponse): NextResponse {
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  return response;
}
