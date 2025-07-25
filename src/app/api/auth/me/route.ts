// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
<<<<<<< HEAD
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
=======
import { getCurrentUser } from '@/lib/auth';

// Add this line to force dynamic rendering for this API route
export const dynamic = 'force-dynamic'; // <--- ADD THIS LINE

export async function GET() {
  const session = await getCurrentUser();
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c

  if (!session) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  // Devuelve solo la información segura del usuario, sin la contraseña ni secretos
  const { password, twoFactorSecret, ...userSafeData } = session;

  return NextResponse.json(userSafeData);
}