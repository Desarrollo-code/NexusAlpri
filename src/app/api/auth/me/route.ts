
// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// This line is crucial for preventing Next.js from caching the response
// and ensuring it always calls the function dynamically.
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  
  // The password and other sensitive fields are already removed by getCurrentUser
  return NextResponse.json({ user });
}
