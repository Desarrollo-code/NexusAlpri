// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  
  const { password, twoFactorSecret, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
