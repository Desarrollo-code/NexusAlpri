
import { getCurrentUser } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
